# Google Apps Script feed bridge

Use this bridge only for official CSV exports, approved feeds, or data whose reuse is explicitly permitted. It is not authorization to scrape a provider.

1. Create a Google Sheet named `approved_feed` with the columns documented in `Code.gs`.
2. Paste `Code.gs` into Apps Script.
3. Add Script Properties `SITE_IMPORT_URL` and `GAS_IMPORT_SECRET`.
4. Run `pushApprovedFeed` manually, then `installDailyTrigger` if daily sync is permitted.
5. Imported records stay separate by provider and require editorial review before public display.
