import { addDoorSale } from "@/app/services/googleSheetsService";

export async function POST(req) {
  try {
    const body = await req.json();
    const { cantidad, metodoPago } = body;

    if (!cantidad || !metodoPago) {
      return new Response(JSON.stringify({ success: false, message: "Faltan datos" }), { status: 400 });
    }

    const result = await addDoorSale({ cantidad, metodoPago });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("❌ Error registrando venta:", error);
    return new Response(JSON.stringify({ success: false, message: "Error del servidor" }), { status: 500 });
  }
}