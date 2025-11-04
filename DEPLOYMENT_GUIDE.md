# Deployment Guide - Podcast Question Generator

Complete step-by-step guide to deploy and configure your combined Cloudflare Worker.

## Prerequisites

- Cloudflare account with Workers enabled
- Google account (for Google Sheets)
- Mailchimp account
- OpenAI API key (you already have this)

---

## Step 1: Deploy the Combined Worker

### 1.1 Copy the Worker Code

1. Open `worker-combined.js` in this project
2. Copy the entire file contents
3. Go to your Cloudflare Dashboard → Workers & Pages
4. Open your existing worker (or create a new one)
5. Replace all the code with the copied code from `worker-combined.js`
6. Click **Save and Deploy**

### 1.2 Verify Worker URL

Your worker should be accessible at:
- `https://podcast-question-proxy.hugo-3ec.workers.dev` (or your custom URL)

---

## Step 2: Set Up Google Sheets with Apps Script

### 2.1 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Podcast Question Generator Submissions"
4. Set up headers in Row 1:
   ```
   Timestamp | Email | Name | Audience | Guest Bio | Questions | Generate Mode
   ```

### 2.2 Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any default code
3. Copy the code from `google-apps-script.js` in this project
4. Paste it into the Apps Script editor
5. Click **Save** (💾 icon)

### 2.3 Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "Podcast Question Generator Webhook"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" (or "Anyone with Google account" for security)
5. Click **Deploy**
6. **Copy the Web app URL** - This is your `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`
   - It will look like: `https://script.google.com/macros/s/AKfycb.../exec`
7. Click **Authorize access** and grant permissions when prompted

### 2.4 Test the Webhook (Optional)

You can test the webhook URL in a browser - it should return an error (that's expected, it needs POST data).

---

## Step 3: Set Up Mailchimp

### 3.1 Get Your API Key

1. Log in to [Mailchimp](https://mailchimp.com/)
2. Go to **Account** → **Extras** → **API keys**
3. Create a new API key or copy an existing one
4. Note the format: `xxxxx-us1` (the `us1` part is your data center)

### 3.2 Get Your List ID

1. In Mailchimp, go to **Audience** → **All contacts**
2. Click on your audience/list
3. Go to **Settings** → **Audience name and defaults**
4. Find the **Audience ID** - this is your `MAILCHIMP_LIST_ID`

### 3.3 Create Tags (Optional but Recommended)

1. In Mailchimp, go to **Audience** → **Tags**
2. Create tags you want to use:
   - `podcast-question-generator` (default)
   - Or create custom tags like `podcast-tool`, `moondesk-tool`, etc.
3. Note: Tags are case-sensitive!

---

## Step 4: Configure Cloudflare Worker Environment Variables

### 4.1 Add Environment Variables

1. In Cloudflare Dashboard, go to your Worker
2. Click **Settings** → **Variables**
3. Add the following **Environment Variables**:

```
OPENAI_API_KEY=sk-proj-your-openai-key-here
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
MAILCHIMP_API_KEY=your-mailchimp-api-key-here
MAILCHIMP_LIST_ID=your-list-id-here
MAILCHIMP_TAGS=podcast-question-generator
```

### 4.2 Variable Details

- **OPENAI_API_KEY**: Your OpenAI API key (you already have this)
- **GOOGLE_APPS_SCRIPT_WEBHOOK_URL**: The webhook URL from Step 2.3
- **MAILCHIMP_API_KEY**: Your Mailchimp API key from Step 3.1
- **MAILCHIMP_LIST_ID**: Your Mailchimp list ID from Step 3.2
- **MAILCHIMP_TAGS**: Comma-separated tags (optional, defaults to `podcast-question-generator`)

### 4.3 Save Changes

1. Click **Save** after adding all variables
2. The worker will automatically redeploy with new variables

---

## Step 5: Update Frontend URL (if needed)

### 5.1 Check Frontend Configuration

1. Open `src/PodcastQuestionOptimizer.jsx`
2. Find the fetch URL (around line 51):
   ```javascript
   const response = await fetch('https://podcast-question-proxy.hugo-3ec.workers.dev/submit-email', {
   ```
3. Update it if your worker URL is different:
   ```javascript
   const response = await fetch('https://YOUR-WORKER-URL.workers.dev/submit-email', {
   ```

### 5.2 Verify OpenAI Proxy URL

1. Also check line 155 in the same file:
   ```javascript
   const response = await fetch('https://podcast-question-proxy.hugo-3ec.workers.dev', {
   ```
2. Update if your worker URL is different

---

## Step 6: Test the Integration

### 6.1 Test Email Submission

1. Run your app locally: `npm run dev`
2. Fill out the form:
   - Enter audience and guest bio
   - Add some questions (or check "Generate questions")
3. Click "Analyze Questions" or "Generate Questions"
4. The email modal should appear
5. Enter email and name
6. Click "Continue"

### 6.2 Verify Data

**Check Google Sheets:**
- Open your Google Sheet
- You should see a new row with:
  - Timestamp
  - Email
  - Name
  - Audience
  - Guest Bio
  - Questions
  - Generate Mode (Yes/No)

**Check Mailchimp:**
- Go to Mailchimp → Audience → All contacts
- Find the email you submitted
- Verify it has the correct tags applied
- Check that first name and last name are populated

**Check OpenAI Response:**
- The question analysis should proceed normally after email submission
- Verify the AI-generated feedback appears

### 6.3 Check Worker Logs

1. In Cloudflare Dashboard → Workers
2. Click on your worker
3. Go to **Logs** tab
4. Look for any errors or warnings
5. Check for:
   - Successful Google Sheets submissions
   - Successful Mailchimp additions
   - Any API errors

---

## Step 7: Troubleshooting

### Issue: Email submission fails

**Check:**
- Worker environment variables are set correctly
- Worker URL matches frontend fetch URL
- CORS headers are working (check browser console)

### Issue: Google Sheets not receiving data

**Check:**
- Apps Script webhook URL is correct
- Web app is deployed with "Anyone" access
- Apps Script execution logs: View → Executions in Apps Script editor

### Issue: Mailchimp not adding contacts

**Check:**
- API key format is correct (includes data center)
- List ID is correct
- Tags exist in Mailchimp (case-sensitive)
- Check Mailchimp API logs for errors

### Issue: OpenAI requests failing

**Check:**
- OPENAI_API_KEY is set correctly
- Worker CORS headers include your domain
- Check worker logs for API errors

---

## Step 8: Production Deployment

### 8.1 Build Your Frontend

```bash
npm run build
```

### 8.2 Deploy Frontend

Deploy the `dist` folder to your hosting:
- WordPress (as per your README)
- Or any static hosting service

### 8.3 Update CORS (if needed)

If your frontend is on a different domain, update the CORS headers in `worker-combined.js`:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-actual-domain.com',
  // ... rest of headers
};
```

---

## Quick Reference Checklist

- [ ] Worker code deployed to Cloudflare
- [ ] Google Sheet created with headers
- [ ] Google Apps Script deployed as web app
- [ ] Mailchimp API key obtained
- [ ] Mailchimp List ID obtained
- [ ] Mailchimp tags created
- [ ] All environment variables set in Cloudflare Worker
- [ ] Frontend URLs updated (if needed)
- [ ] Test submission successful
- [ ] Data appears in Google Sheets
- [ ] Contact added to Mailchimp with tags
- [ ] OpenAI responses working

---

## Support

If you encounter issues:
1. Check Cloudflare Worker logs
2. Check Google Apps Script execution logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

