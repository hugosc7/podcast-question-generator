/**
 * Combined Cloudflare Worker for Podcast Question Generator
 * Handles both OpenAI API proxy and email submission to Google Sheets/Mailchimp
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers - allow all origins for testing (change to specific domain for production)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Allow all origins for testing
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Route: Email submission endpoint
    if (url.pathname === '/submit-email' && request.method === 'POST') {
      try {
        const { 
          email, 
          name, 
          timestamp, 
          audience, 
          guestBio, 
          questions, 
          generateMode 
        } = await request.json();
        
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        // Add to Google Sheets and Mailchimp in parallel
        // Both operations are attempted even if one fails
        const [sheetsResult, mailchimpResult] = await Promise.allSettled([
          addToGoogleSheets(
            email, 
            name, 
            timestamp, 
            audience,
            guestBio,
            questions,
            generateMode,
            env
          ),
          addToMailchimp(email, name, env)
        ]);
        
        // Extract results from Promise.allSettled
        const sheets = sheetsResult.status === 'fulfilled' 
          ? sheetsResult.value 
          : { success: false, error: sheetsResult.reason?.message || sheetsResult.reason?.toString() || 'Unknown error' };
        const mailchimp = mailchimpResult.status === 'fulfilled' 
          ? mailchimpResult.value 
          : { success: false, error: mailchimpResult.reason?.message || mailchimpResult.reason?.toString() || 'Unknown error' };
        
        // Return success if at least one succeeded, or if both were attempted
        const overallSuccess = sheets.success || mailchimp.success || (!sheets.error && !mailchimp.error);
        
        return new Response(JSON.stringify({ 
          success: overallSuccess,
          sheets: sheets,
          mailchimp: mailchimp
        }), {
          status: overallSuccess ? 200 : 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Email submission error:', error);
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message || 'Failed to submit email'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Route: OpenAI API proxy (default route)
    if (request.method === 'POST') {
      try {
        // Get the request body from your frontend
        const body = await request.json();

        // Call OpenAI API with your secret key
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        // Return the response to your frontend
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Method not allowed for other routes
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }
};

/**
 * Add email and form data to Google Sheets via Apps Script webhook
 * Requires: GOOGLE_APPS_SCRIPT_WEBHOOK_URL
 */
async function addToGoogleSheets(
  email, 
  name, 
  timestamp, 
  audience,
  guestBio,
  questions,
  generateMode,
  env
) {
  const webhookUrl = env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Google Apps Script webhook URL not configured');
    return { success: false, error: 'Google Sheets not configured' };
  }
  
  try {
    const payload = {
      timestamp: timestamp || new Date().toISOString(),
      email: email,
      name: name || 'Anonymous',
      audience: audience || '',
      guestBio: guestBio || '',
      questions: questions || '',
      generateMode: generateMode || false
    };
    
    console.log('Sending to Google Sheets:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Google Sheets response status:', response.status);
    const responseText = await response.text();
    console.log('Google Sheets response text:', responseText);
    
    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.status} - ${responseText}`);
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { success: true, message: responseText };
    }
    console.log('Google Sheets parsed result:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Google Sheets error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add email to Mailchimp with tags
 * Requires: MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID
 * Optional: MAILCHIMP_TAGS - comma-separated list of tags to add
 */
async function addToMailchimp(email, name, env) {
  if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_LIST_ID) {
    console.log('Mailchimp credentials not configured');
    return { success: false, error: 'Mailchimp not configured' };
  }

  try {
    // Extract data center from API key (format: xxxxx-us10)
    const apiKeyParts = env.MAILCHIMP_API_KEY.split('-');
    const dataCenter = apiKeyParts[1] || 'us10';
    const mailchimpUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members`;

    // Split name into first and last name
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const tags = env.MAILCHIMP_TAGS ? env.MAILCHIMP_TAGS.split(',').map(t => t.trim()) : ['podcast-question-generator'];

    const response = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
        tags: tags
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // If user already exists (status 400 with specific error), that's okay
      if (errorData.title === 'Member Exists') {
        console.log('User already exists in Mailchimp');
        return { success: true, message: 'Already subscribed' };
      }
      throw new Error(`Mailchimp API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    console.log('Successfully added to Mailchimp');
    return { success: true, tags: tags };
  } catch (error) {
    console.error('Error adding to Mailchimp:', error);
    return { success: false, error: error.message };
  }
}


