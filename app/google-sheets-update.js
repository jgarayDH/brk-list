'use server'
import { google } from 'googleapis';

export async function updateRowData(rowToUpdate, newValues) {
  try {
    // Obtén las credenciales del servicio
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
    console.log("yes")
    // Crea una instancia de Google Sheets
    const glSheets = google.sheets({ version: "v4", auth: glAuth });

    // ID de la hoja de cálculo
    const spreadsheetId = process.env.SPREEDSHEETID;

    // Rango donde deseas obtener los datos (en este caso, fila específica)
    const range = `undermotion!A${rowToUpdate}:G${rowToUpdate}`;

    // Realiza la solicitud para obtener los datos de la fila
    const response = await glSheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    // Extrae los datos actuales de la fila
    const currentValues = response.data.values[0];

    // Realiza cualquier lógica necesaria para actualizar los valores (puedes personalizar esto según tus necesidades)
    const updatedValues = [
      newValues[0] || currentValues[0],
    ];

    // Actualiza los valores en la hoja de cálculo
    await glSheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [updatedValues] },
    });

    // Realiza cualquier otra acción necesaria después de la actualización
    // ...

    // Actualiza el estado local si es necesario
    // ...

    // Realiza una nueva solicitud para obtener los datos actualizados si es necesario
    // ...

    console.log('Datos actualizados:', updatedValues);
  } catch (error) {
    console.error('Error al actualizar datos en la hoja de cálculo:', error);
  }
}

export async function updateCellValue(rowToUpdate, columnIndex, newValue) {
    try {
      // Obtén las credenciales del servicio
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
  
      // Crea una instancia de Google Sheets
      const glSheets = google.sheets({ version: "v4", auth: glAuth });
  
      // ID de la hoja de cálculo
      const spreadsheetId = process.env.SPREEDSHEETID;
  
      // Rango donde deseas obtener y actualizar el valor (celda específica en este caso)
      console.log(rowToUpdate)
      const cellRange = `undermotion!G${rowToUpdate}`;
  
      // Realiza la solicitud para obtener el valor actual de la celda
      const response = await glSheets.spreadsheets.values.get({
        spreadsheetId,
        range: cellRange,
      });
  
      // Extrae el valor actual de la celda
      const currentValue = response.data.values[0] ? response.data.values[0][0] : '';
  
      // Realiza cualquier lógica necesaria para actualizar el valor (puedes personalizar esto según tus necesidades)
      const updatedValue = newValue || currentValue;
  
      // Actualiza el valor en la hoja de cálculo
      await glSheets.spreadsheets.values.update({
        spreadsheetId,
        range: cellRange,
        valueInputOption: 'RAW',
        requestBody: { values: [[updatedValue]] },
      });
  
      console.log(`Valor actualizado en la celda ${cellRange}:`, updatedValue);
      return true; // Indica que la actualización fue exitosa
    } catch (error) {
      console.error('Error al actualizar datos en la hoja de cálculo:', error);
      return false; // Indica que la actualización falló
    }
  }
