import { updateTicketStatus } from "@/app/services/googleSheetsService";

export async function POST(req) {
    try {
        const { securityCode } = await req.json();
        console.log("🔍 Código recibido:", securityCode);
        if (!securityCode) {
            return new Response(JSON.stringify({ success: false, message: "Código no proporcionado." }), { status: 400 });
        }

        const result = await updateTicketStatus(securityCode);

        if (!result.success) {
            return new Response(JSON.stringify(result), { status: 400 });
        }

        return new Response(JSON.stringify(result), { status: 200 });

    } catch (error) {
        console.error("❌ Error en verify-ticket:", error);
        return new Response(JSON.stringify({ success: false, message: "Error del servidor." }), { status: 500 });
    }
}