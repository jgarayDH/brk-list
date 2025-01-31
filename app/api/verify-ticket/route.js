import { getSheetData, updateTicketStatus } from "../../services/googleSheetsServices";

export async function POST(req) {
    try {
      const { securityCode } = await req.json();
  
      // Obtener la lista de Tickets desde Google Sheets
      const tickets = await getSheetData("Tickets");
  
      // Buscar el ticket con el `security_code`
      const ticket = tickets.find((row) => row.security_code === securityCode);
  
      if (!ticket) {
        return Response.json({ success: false, message: "Código de seguridad inválido." });
      }
  
      if (ticket.attended === "TRUE") {
        return Response.json({ success: false, message: "Este ticket ya ha sido utilizado." });
      }
  
      console.log(`🎟️ Ticket encontrado:`, ticket);
  
      // Obtener la fila correcta del ticket en Google Sheets
      const rowNumber = tickets.indexOf(ticket) + 2; // Ajustar si hay encabezado
  
      if (isNaN(rowNumber) || rowNumber < 2) {
        console.error("❌ Error: Número de fila inválido:", rowNumber);
        return Response.json({ success: false, message: "Error al procesar el ticket." });
      }
  
      // Actualizar `attended` a `TRUE`
      await updateTicketStatus(rowNumber, "TRUE");
  
      return Response.json({ success: true, message: "✅ Ticket validado correctamente." });
    } catch (error) {
      console.error("❌ Error verificando el ticket:", error);
      return Response.json({ success: false, message: "Error en el servidor." });
    }
  }