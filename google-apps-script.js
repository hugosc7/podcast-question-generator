/**
 * Google Apps Script for Podcast Question Generator
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy as Web App (Deploy > New deployment > Web app)
 * 5. Set "Who has access" to "Anyone"
 * 6. Copy the Web app URL and use it as GOOGLE_APPS_SCRIPT_WEBHOOK_URL
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Add row with timestamp
    const row = [
      data.timestamp || new Date().toISOString(),
      data.email || '',
      data.name || 'Anonymous',
      data.audience || '',
      data.guestBio || '',
      data.questions || '',
      data.generateMode ? 'Yes' : 'No'
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

