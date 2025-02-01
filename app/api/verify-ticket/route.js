import { getSheetData, updateTicketStatus } from "../../services/googleSheetsServices";

export async function POST(req) {
    try {
        const { securityCode } = await req.json();
        console.log("📡 Código de Seguridad Recibido:", securityCode);

        if (!securityCode) {
            console.error("❌ No se proporcionó un código de seguridad.");
            return new Response(JSON.stringify({ success: false, message: "Código de seguridad no proporcionado." }), { status: 400 });
        }

        // ✅ Obtener la lista de Tickets desde Google Sheets
        const tickets = await getSheetData("Tickets");
        console.log(`📄 Total de Tickets en la hoja: ${tickets.length}`);

        // ✅ Buscar el ticket con el `security_code`
        const ticket = tickets.find((row) => row.security_code === securityCode);

        if (!ticket) {
            console.warn("⚠️ Código de seguridad inválido:", securityCode);
            return new Response(JSON.stringify({ success: false, message: "Código de seguridad inválido." }), { status: 404 });
        }

        // ✅ Verificar si ya fue escaneado
        if (ticket.attended === "TRUE") {
            console.warn("⚠️ Ticket ya utilizado:", ticket);
            return new Response(JSON.stringify({ success: false, message: "Este ticket ya ha sido utilizado." }), { status: 400 });
        }

        console.log("✅ Ticket encontrado:", ticket);

        // ✅ Obtener la fila correcta del ticket en Google Sheets
        const rowNumber = tickets.indexOf(ticket) + 2; // Ajustar por encabezado en la primera fila
        console.log("📍 Número de fila en Google Sheets:", rowNumber);

        if (isNaN(rowNumber) || rowNumber < 2) {
            console.error("❌ Error: Número de fila inválido:", rowNumber);
            return new Response(JSON.stringify({ success: false, message: "Error al procesar el ticket." }), { status: 500 });
        }

        // ✅ Actualizar `attended` a `TRUE`
        await updateTicketStatus(rowNumber, "TRUE");
        console.log("✅ Ticket actualizado en Google Sheets");

        // ✅ Enviar el ticket actualizado al frontend
        return new Response(JSON.stringify({
            success: true,
            message: "✅ Ticket validado correctamente.",
            ticket: { ...ticket, attended: "TRUE" } // Marcar como actualizado
        }), { status: 200 });

    } catch (error) {
        console.error("❌ Error verificando el ticket:", error);
        return new Response(JSON.stringify({ success: false, message: "Error en el servidor." }), { status: 500 });
    }
}

