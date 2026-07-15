/** Google Sheets columns:
 * providerId, providerItemId, title, maker, catalogNumber, price, affiliateUrl, available
 * Set SITE_IMPORT_URL and GAS_IMPORT_SECRET in Script Properties.
 */
function pushApprovedFeed() {
  const props = PropertiesService.getScriptProperties();
  const endpoint = props.getProperty('SITE_IMPORT_URL');
  const secret = props.getProperty('GAS_IMPORT_SECRET');
  if (!endpoint || !secret) throw new Error('Script Properties are incomplete.');
  const sheet = SpreadsheetApp.getActive().getSheetByName('approved_feed');
  if (!sheet) throw new Error('approved_feed sheet not found.');
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift();
  const items = values.filter(row => row.some(Boolean)).map(row => headers.reduce((item, key, index) => {
    item[key] = key === 'price' ? Number(row[index]) : key === 'available' ? row[index] !== 'FALSE' : row[index];
    return item;
  }, {}));
  const response = UrlFetchApp.fetch(endpoint, { method: 'post', contentType: 'application/json', headers: { 'x-feed-secret': secret }, payload: JSON.stringify({ items }), muteHttpExceptions: true });
  if (response.getResponseCode() >= 300) throw new Error(response.getContentText());
  console.log(response.getContentText());
}

function installDailyTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'pushApprovedFeed').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('pushApprovedFeed').timeBased().everyDays(1).atHour(4).create();
}
