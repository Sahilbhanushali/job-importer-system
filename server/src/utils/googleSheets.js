import { google } from "googleapis";

export const pushToGoogleSheet = async (jobs) => {
  if (!jobs || jobs.length === 0) return;

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./google-creds.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const rows = jobs.map(j => [
      j.title || j.job_title || "",
      j.company || j.company_name || "",
      j.location || "",
      j.email || "",
      j.apply_link || j.link || "",
      j.source || "",
      new Date().toISOString()
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GSHEET_ID,
      range: process.env.GSHEET_RANGE,
      valueInputOption: "RAW",
      resource: {
        values: rows,
      },
    });

    console.log(`Pushed ${rows.length} jobs to Google Sheets`);
  } catch (err) {
    console.error("Error pushing jobs to sheets:", err.message);
  }
};
