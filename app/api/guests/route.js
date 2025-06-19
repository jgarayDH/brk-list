import { getSheetData } from "@/app/services/googleSheetsService";

export async function GET() {
  try {
    const guests = await getSheetData("Guests"); // Puedes cambiar a "Tickets" si es necesario
    return Response.json(guests);
  } catch (error) {
    console.error("Error fetching guest data:", error);
    return new Response(JSON.stringify({ success: false, message: "Error fetching guests" }), { status: 500 });
  }
}