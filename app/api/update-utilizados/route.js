import { updateUtilizadosStatus } from "@/app/services/googleSheetsService";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { sheetName, column, rowNumber, newValue } = await req.json();

    if (!sheetName || !column || !rowNumber || newValue === undefined) {
      return Response.json({ success: false, message: "Faltan datos" }, { status: 400 });
    }

    await updateUtilizadosStatus(sheetName, column, rowNumber, newValue);

    return Response.json({ success: true });
  } catch (error) {
    console.error("❌ Error en API /update-utilizados:", error);
    return Response.json({ success: false, message: "Error interno del servidor" }, { status: 500 });
  }
}