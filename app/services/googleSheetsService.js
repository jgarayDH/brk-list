import { google } from "googleapis";

export async function getSheetData(sheetName) {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SPREEDSHEETID;
    const range = `${sheetName}!A2:H`;

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;

    if (!rows || rows.length === 0) return [];

    return rows.map((row, index) => ({
        rowNumber: index + 2, // Para referencia en actualizaciones
        id: row[0],
        name: row[1],
        cantidad: parseInt(row[2], 10) || 0,
        codigo: row[3],
        tipo_entrada: row[4],
        utilizados: parseInt(row[5], 10) || 0,
        attended: row[6],
    }));
}

export async function updateUtilizadosStatus(sheetName, columnLetter, row, newValue) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREEDSHEETID;
  const range = `${sheetName}!${columnLetter}${row}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [[newValue]],
    },
  });
}

export async function getGuestByCode(code) {
  const guests = await getSheetData("Guests");
  return guests.find((g) => g.codigo === code);
}

export async function markGuestAsUsed(rowNumber, newValue = 1) {
  await updateUtilizadosStatus("Guests", "F", rowNumber, newValue);
}

export async function updateTicketStatus(securityCode, newValue = "TRUE") {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREEDSHEETID;
  const sheetName = "Tickets";
  const range = `${sheetName}!A2:H`;

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values;

  if (!rows || rows.length === 0) {
    return { success: false, message: "No hay datos." };
  }

  const rowIndex = rows.findIndex((row) => row[4] === securityCode);

  if (rowIndex === -1) {
    return { success: false, message: "Ticket no encontrado." };
  }

  const attended = rows[rowIndex][6];

  if (attended === "TRUE") {
    return {
      success: false,
      message: "El ticket ya fue utilizado.",
      ticket: {
        name: rows[rowIndex][0],
        email: rows[rowIndex][1],
        producto: rows[rowIndex][2],
        order_id: rows[rowIndex][3],
        security_code: rows[rowIndex][4],
        attended,
      },
    };
  }

  const updateRange = `${sheetName}!G${rowIndex + 2}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: updateRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [[newValue]],
    },
  });

  return {
    success: true,
    message: "Ticket actualizado correctamente.",
    ticket: {
      name: rows[rowIndex][0],
      email: rows[rowIndex][1],
      producto: rows[rowIndex][2],
      order_id: rows[rowIndex][3],
      security_code: rows[rowIndex][4],
      attended: newValue,
    },
  };
}

export async function updateGuestStatus(code) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREEDSHEETID;

  const range = `Guests!A2:H`;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    return { success: false, message: "No hay registros." };
  }

  const matchingRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row[3] === code);

  for (const { row, index } of matchingRows) {
    const cantidad = parseInt(row[2]) || 0;
    const utilizados = parseInt(row[5]) || 0;

    if (utilizados < cantidad) {
      const newUtilizados = utilizados + 1;
      const rowNumber = index + 2;
      const updateRange = `Guests!F${rowNumber}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: updateRange,
        valueInputOption: "RAW",
        requestBody: {
          values: [[String(newUtilizados)]],
        },
      });

      return {
        success: true,
        message: "✅ Guest validado correctamente.",
        guest: {
          id: row[0],
          name: row[1],
          cantidad,
          codigo: row[3],
          tipo_entrada: row[4],
          utilizados: newUtilizados,
          attended: newUtilizados >= cantidad ? "TRUE" : "FALSE",
        }
      };
    }
  }

  return { success: false, message: "Todos los tickets ya fueron utilizados." };
}

export async function addDoorSale({ cantidad, metodoPago }) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREEDSHEETID;

  const now = new Date();
  const fecha = now.toLocaleString("es-SV", { timeZone: "America/El_Salvador" });
  const total = parseInt(cantidad, 10) * 20;

  const values = [[fecha, cantidad, metodoPago, total]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "VentasPuerta!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return { success: true };
}

async function getAuth() {
  return await google.auth.getClient({
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
}
