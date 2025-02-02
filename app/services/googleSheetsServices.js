'use server';
import { google } from "googleapis";

const getAuthClient = async () => {
  return await google.auth.getClient({
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
};

const getGoogleSheets = async () => {
  const auth = await getAuthClient();
  return google.sheets({ version: "v4", auth });
};

export const getSheetData = async (sheetName) => {
  const sheets = await getGoogleSheets();
  const spreadsheetId = process.env.SPREEDSHEETID;

  const range = `${sheetName}!A1:Z1000`;

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });

  const [headers, ...rows] = response.data.values;

  return rows.map((row) =>
    headers.reduce((acc, header, i) => {
      acc[header.toLowerCase()] = row[i] || "";
      return acc;
    }, {})
  );
};

// ✅ Actualiza la columna "E" en `undermotion` (Asistencia de invitados)
export const updateAttendedStatus = async (row, status) => {
  const sheets = await getGoogleSheets();
  const spreadsheetId = process.env.SPREEDSHEETID;
  const range = `undermotion!G${row}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
};

// ✅ Actualiza la columna "G" en `Tickets` (Estado del Ticket)
export const updateTicketStatus = async (row, status) => {
  if (!row || isNaN(row)) {
    console.error("❌ Error: Número de fila inválido en updateTicketStatus:", row);
    return;
  }

  const sheets = await getGoogleSheets();
  const spreadsheetId = process.env.SPREEDSHEETID;
  const range = `Tickets!G${row}`;

  console.log(`🔹 Actualizando fila ${row} en ${range}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
};

// ✅ Nueva función para actualizar la columna "G" en `undermotion` (Boletos utilizados)
export const updateUtilizadosStatus = async (row, utilizados) => {
  if (!row || isNaN(row)) {
    console.error("❌ Error: Número de fila inválido en updateUtilizadosStatus:", row);
    return;
  }

  const sheets = await getGoogleSheets();
  const spreadsheetId = process.env.SPREEDSHEETID;
  const range = `undermotion!G${row}`;

  console.log(`🔹 Actualizando fila ${row} en ${range} con valor: ${utilizados}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[utilizados]] },
  });
};