'use server';
import { google } from "googleapis";

export async function getSheetData() {
    const glAuth = await google.auth.getClient({
        projectId: process.env.GOOGLE_SHEET_PROJECT_ID,
        credentials: {
            "type": "service_account",
            "project_id": process.env.GOOGLE_SHEET_PROJECT_ID,
            "private_key_id": process.env.GOOGLE_SHEET_PRIVATE_KEY_ID,
            "private_key": process.env.GOOGLE_SHEET_PRIVATE_KEY.replace(/\\n/g, "\n"),
            "client_email": process.env.GOOGLE_SHEET_CLIENT_EMAIL,
            "client_id": process.env.GOOGLE_SHEET_CLIENT_ID,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/thebrk%40thebrk-414904.iam.gserviceaccount.com",
            "universe_domain": "googleapis.com"
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    

    const glSheets = google.sheets({ version: "v4", auth: glAuth });

    const data = await glSheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREEDSHEETID,
        range: 'undermotion'
    });

    // Verificar si hay datos antes de intentar organizar
    if (data.data.values && data.data.values.length > 1) {
        const headers = data.data.values[0].map(header => header.toLowerCase()); // Convertir a minúsculas
        const jsonData = [];

        for (let i = 1; i < data.data.values.length; i++) {
            const row = data.data.values[i];
            const rowData = {};

            for (let j = 0; j < headers.length; j++) {
                if (['cantidad', 'entradas', 'utilizados'].includes(headers[j])) {
                    rowData[headers[j]] = parseInt(row[j], 10) || 0;
                } else {
                    rowData[headers[j]] = row[j];
                }
            }

            jsonData.push(rowData);
        }

        return { data: jsonData };
    } else {
        console.log("No hay datos para organizar");
        return { data: [] };
    }
}

