import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  try {
    const { row, utilizados } = req.body;

    if (!row || isNaN(row) || utilizados < 0) {
      return res.status(400).json({ success: false, message: "Datos inválidos" });
    }

    const auth = await google.auth.getClient({
      projectId: process.env.GOOGLE_SHEET_PROJECT_ID,
      credentials: {
        type: "service_account",
        project_id: process.env.GOOGLE_SHEET_PROJECT_ID,
        private_key_id: process.env.GOOGLE_SHEET_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_SHEET_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_SHEET_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SHEET_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.GOOGLE_SHEET_CERT_URL,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SPREEDSHEETID;
    const range = `undermotion!G${row}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [[utilizados]] },
    });

    res.status(200).json({ success: true, message: "Boletos actualizados correctamente" });
  } catch (error) {
    console.error("❌ Error actualizando los boletos en undermotion:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
}