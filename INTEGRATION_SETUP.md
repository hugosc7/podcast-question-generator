# Email Integration Setup Guide

This guide explains how to set up Google Sheets and Mailchimp integration for the email gating feature.

## Overview

When users click the submit button, a modal popup appears asking for their email and name. Once submitted, the information is:
1. Added to your Google Sheet
2. Added to your Mailchimp mailing list
3. Then the question analysis proceeds

## Setup Instructions

### 1. Update Your Cloudflare Worker

Your existing Cloudflare Worker at `https://podcast-question-proxy.hugo-3ec.workers.dev` needs to be updated to handle the `/submit-email` endpoint.

1. Open your Cloudflare Worker dashboard
2. Add the route handler from `worker-integration.js` to your existing worker
3. Set up the following environment variables in Cloudflare Workers:

#### Required Environment Variables:

- `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` - Your Google Apps Script web app URL
- `MAILCHIMP_API_KEY` - Your Mailchimp API key
- `MAILCHIMP_LIST_ID` - Your Mailchimp audience/list ID
- `MAILCHIMP_TAGS` - Comma-separated list of tags (optional, defaults to `podcast-question-generator`)

### 2. Google Sheets Setup with Apps Script

#### Step 1: Create a Google Sheet
1. Create a new Google Sheet
2. Set up headers in row 1: `Timestamp`, `Email`, `Name`, `Audience`, `Guest Bio`, `Questions`, `Generate Mode`
3. Your sheet will automatically receive data via the Apps Script webhook

#### Step 2: Create Google Apps Script
1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. Delete any default code and paste the following:

```javascript
function doPost(e) {
  try {
    // Parse the JSON data from the request
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Append the data as a new row
    // Order: Timestamp, Email, Name, Audience, Guest Bio, Questions, Generate Mode
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.email || '',
      data.name || 'Anonymous',
      data.audience || '',
      data.guestBio || '',
      data.questions || '',
      data.generateMode ? 'Yes' : 'No'
    ]);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

#### Step 3: Deploy as Web App
1. Click **Deploy** > **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Set the following:
   - **Description**: "Podcast Question Generator Webhook"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" (or "Anyone with Google account" if you want to restrict)
4. Click **Deploy**
5. **Copy the Web app URL** - this is your `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`
6. Click **Authorize access** and grant permissions when prompted

### 3. Mailchimp Setup

#### Step 1: Get Your API Key
1. Log in to [Mailchimp](https://mailchimp.com/)
2. Go to Account > Extras > API keys
3. Create a new API key or copy an existing one
4. The API key format is: `xxxxx-us1` (the `us1` part is the server prefix)

#### Step 2: Get Your List ID
1. Go to Audience > All contacts
2. Click on your audience/list
3. Go to Settings > Audience name and defaults
4. Find the "Audience ID" (this is your List ID)

#### Step 3: Create Tags (Optional)
1. In Mailchimp, go to **Audience** > **Tags**
2. Create tags you want to use (e.g., `podcast-question-generator`, `podcast-tool`, etc.)
3. If you don't create tags, the default tag `podcast-question-generator` will be used

### 4. Update Cloudflare Worker Environment Variables

In your Cloudflare Worker dashboard:

1. Go to your worker settings
2. Navigate to "Variables" or "Settings" > "Variables"
3. Add the following secrets/environment variables:

```
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
MAILCHIMP_API_KEY=your_mailchimp_api_key_here
MAILCHIMP_LIST_ID=your_list_id_here
MAILCHIMP_TAGS=podcast-question-generator,podcast-tool
```

**Note**: For `MAILCHIMP_TAGS`, use a comma-separated list. If not provided, it defaults to `podcast-question-generator`.

### 5. Test the Integration

1. Deploy your updated Cloudflare Worker
2. Test the form submission in your app
3. Check:
   - Google Sheet should have a new row with: timestamp, email, name, audience, guest bio, questions, and generate mode
   - Mailchimp should have a new subscriber with the proper tags applied

## Troubleshooting

### Google Sheets Issues
- **403 Error**: Make sure the Apps Script web app is deployed with "Anyone" access
- **404 Error**: Check that the webhook URL is correct (should end with `/exec`)
- **Script not running**: Make sure you authorized the script when deploying
- **Data not appearing**: Check Apps Script execution logs (View > Executions)

### Google Apps Script Tips
- The script runs in the context of the spreadsheet owner
- You can view execution logs in Apps Script: **View** > **Executions**
- If you update the script, you need to create a new deployment version

### Mailchimp Issues
- **401 Error**: Check that your API key is correct
- **404 Error**: Verify your List ID is correct
- **Member Exists**: This is okay - existing members will be updated with new tags
- **Tags not appearing**: Make sure the tags exist in Mailchimp before they're used
- **Tag errors**: Check that tag names match exactly (case-sensitive)

### Testing Without Integration
If you want to test the frontend without setting up the backend, the modal will show an error. You can temporarily modify the fetch URL or add error handling to proceed anyway (not recommended for production).

## Security Notes

- Never expose API keys in client-side code
- Use Cloudflare Workers secrets for sensitive credentials
- Consider rate limiting to prevent abuse
- Validate email addresses on both client and server side

## Support

If you encounter issues, check:
1. Cloudflare Worker logs for error messages
2. Browser console for frontend errors
3. Google Sheets API quota limits
4. Mailchimp API rate limits

