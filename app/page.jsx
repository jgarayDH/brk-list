"use client";
import React, { useState, useEffect } from "react";
// Se ha removido la importación directa del servicio de Google Sheets
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import dynamic from "next/dynamic"; // ✅ Evita errores SSR
import { InputNumber } from 'primereact/inputnumber';
import "./styles/globals.css";

// ✅ Cargar `Scanner` dinámicamente sin SSR
const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner), { ssr: false });

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    nombre: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrMessage, setQrMessage] = useState("");

  const [showVentaModal, setShowVentaModal] = useState(false);
  const [cantidadVenta, setCantidadVenta] = useState(1);
  const [metodoPago, setMetodoPago] = useState("cash");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log("📦 Cambió qrData:", qrData);
    if (qrData && !isProcessing) {
      validateTicket();
    }
  }, [qrData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guests");
      const data = await res.json();

      console.log("📄 Data obtenida desde /api/guests:", data); // 👈 Aquí la puedes ver

      setSheetData(data);
    } catch (error) {
      console.error("❌ Error fetching sheet data:", error);
    }
    setLoading(false);
  };

  const resetScanner = () => {
    setIsProcessing(false);
    setLoadingQR(false);
    setTicketInfo(null);
    setQrMessage("");
    setScannerActive(true);
    setQrData(null);
  };

  const closeModal = () => {
    setShowQRModal(false);
    resetScanner();
  };

  const isUrlQrCode = (data) => {
    try {
      const url = new URL(data);
      return url.searchParams.has("security_code");
    } catch {
      return false;
    }
  };

  const validateTicket = async () => {
    setIsProcessing(true);
    setScannerActive(false);
    setLoadingQR(true);

    try {
      if (!qrData || !Array.isArray(qrData) || qrData.length === 0) {
        console.log("🧪 Ejecutando validateTicket con qrData:", qrData);
        setQrMessage("❌ No se pudo leer el código QR.");
        setTimeout(resetScanner, 3000);
        return;
      }

      const scannedValue = qrData[0]?.rawValue;
      console.log("🔍 Valor escaneado (rawValue):", scannedValue);

      if (isUrlQrCode(scannedValue)) {
        // ✅ TICKET CON URL
        const url = new URL(scannedValue);
        const securityCode = url.searchParams.get("security_code");
        console.log("🔒 Código de seguridad extraído:", securityCode);
        console.log("📡 Enviando a /api/verify-ticket:", { securityCode });
        const response = await fetch("/api/verify-ticket", {
          method: "POST",
          body: JSON.stringify({ securityCode }),
          headers: { "Content-Type": "application/json" },
        });

        const { success, message, ticket } = await response.json();

        if (success) {
          setTicketInfo(ticket);
          setQrMessage("✅ Ticket válido.");
          fetchData();
        } else {
          if (ticket) {
            setTicketInfo(ticket);
          } else {
            setTicketInfo(null);
          }
          setQrMessage(`❌ ${message}`);
        }
      } else {
        // ✅ TICKET DE INVITADO (GUEST)
        const codigo = scannedValue;
        console.log("📨 Enviando a /api/verify-guest:", { codigo });

        const response = await fetch("/api/verify-guest", {
          method: "POST",
          body: JSON.stringify({ codigo }),
          headers: { "Content-Type": "application/json" },
        });

        const { success, message, guest } = await response.json();

        if (success) {
          setTicketInfo(guest);
          setQrMessage("✅ Invitado válido.");
          fetchData();
        } else {
          setTicketInfo(guest || null);
          setQrMessage(`❌ ${message}`);
        }
      }
    } catch (err) {
      console.error("❌ Error general:", err);
      setQrMessage("❌ Error procesando el QR.");
    }

    setLoadingQR(false);
    setIsProcessing(false);
  };

  // ✅ Nueva función para actualizar la columna "G" en `undermotion`
  const handleTicketChange = async (rowData, newValue) => {
    if (newValue >= 0 && newValue <= rowData.cantidad) {
      const rowNumber = sheetData.findIndex(row => row.id === rowData.id) + 2;

      try {
        await fetch("/api/update-utilizados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheetName: "Guests",
            column: "F",
            rowNumber,
            newValue,
          }),
        });
        fetchData();
      } catch (error) {
        console.error("❌ Error al actualizar boletos:", error);
      }
    }
  };

  const ticketCountTemplate = (rowData) => {
    const boletosDisponibles = rowData.cantidad - rowData.utilizados;
    return (
      <div className="flex justify-content-between align-items-center">
        <span className="mr-5">Disponibles: <span className="font-bold">{boletosDisponibles}</span></span>
        <InputNumber
          value={rowData.utilizados}
          onValueChange={(e) => handleTicketChange(rowData, e.value)}
          showButtons
          step={1}
          min={0}
          max={rowData.cantidad}
          disabled={boletosDisponibles === 0}
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
          inputClassName="w-3rem text-center"
        />
      </div>
    );
  };

  const totalTicketsUsed = sheetData.reduce(
    (total, row) => total + (parseInt(row.utilizados) || 0),
    0
  );

  const totalTicketsAvailable = sheetData.reduce(
    (total, row) => total + ((parseInt(row.cantidad) || 0) - (parseInt(row.utilizados) || 0)),
    0
  );

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const clearInput = () => {
    setGlobalFilterValue('');
    setFilters({ ...filters, nombre: { value: null } });
  };

  const isTicketUsed = (ticket) => {
    if ("attended" in ticket) {
      return ticket.attended === "TRUE";
    } else {
      return parseInt(ticket.utilizados || 0) >= parseInt(ticket.cantidad || 0);
    }
  };

  const registrarVenta = async () => {
    try {
      const response = await fetch("/api/add-door-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: cantidadVenta, metodoPago }) // ✅ corrección aquí
      });
      const data = await response.json();
      if (data.success) {
        setCantidadVenta(1);
        setMetodoPago("cash");
        setShowVentaModal(false);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("❌ Error al registrar venta:", error);
    }
  };

  return (
    <div className="p-2">
      <h1 className="mb-3">UNDR | Cinema 06.09.25</h1>
      <p className="mt-1 text-right flex gap-4 justify-content-end">
        <p>
          🎟️ <strong>Total boletos utilizados:</strong> {totalTicketsUsed}
        </p>
        <p>
          🎫 <strong>Total boletos disponibles:</strong> {totalTicketsAvailable}
        </p>
      </p>

      <div className="flex flex-column sm:flex-row pb-3 gap-3">
        <InputText
          className="flex-auto flex"
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Buscar por nombre"
        />

        <Button icon="pi pi-refresh" label="Recargar" onClick={fetchData} disabled={loading} />
        <Button icon="pi pi-times" label="Limpiar" onClick={clearInput} />
        <Button icon="pi pi-qrcode" label="Escanear QR" onClick={() => setShowQRModal(true)} />
        <Button icon="pi pi-plus" label="Registrar venta en puerta" onClick={() => setShowVentaModal(true)} />
      </div>

      <DataTable value={sheetData} paginator rows={50} filters={filters} globalFilterFields={["name", "codigo", "tipo_entrada"]} loading={loading} dataKey="id" tableStyle={{ minWidth: "50rem" }}>
        <Column field="name" header="Nombre" />
        <Column field="codigo" header="Codigo" />
        <Column field="tipo_entrada" header="Tipo de entrada" />
        {/* <Column field="socio" header="Socio" /> */}
        <Column field="utilizados" header="Tickets disponibles" body={ticketCountTemplate}></Column>
      </DataTable>

      <Dialog header="Escanear Código QR" visible={showQRModal} onHide={closeModal} className="qr-dialog">
        <div className="qr-scanner-container">
          {scannerActive && !loadingQR && !ticketInfo && (
            <Scanner
              onScan={(result) => {
                console.log("📸 Resultado escaneado:", result);
                setQrData(result);
              }}
              onError={(error) => console.error("❌ Error escaneando:", error)}
              constraints={{ facingMode: "environment" }}
              style={{ width: "100%", height: "100vh" }}
            />
          )}

          {loadingQR && (
            <div className="loading-screen">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: "3rem", color: "white" }}></i>
              <p className="qr-message">Validando ticket...</p>
            </div>
          )}

          {ticketInfo && qrMessage.startsWith("✅") && (
            <div className="ticket-info bg-white">
              <h2>🎟️ Ticket Escaneado correctamente</h2>
              <p><strong>Nombre:</strong> {ticketInfo.name}</p>
              <p><strong>Producto:</strong> {ticketInfo.producto || "Cortesía"}</p>
              <p><strong>Order ID:</strong> {ticketInfo.order_id || "N/A"}</p>
              <p><strong>Estado:</strong> {ticketInfo.attended === "TRUE" ? "⚠️ Usado" : "✅ Válido"}</p>
            </div>
          )}

          <div className="qr-message">
            {qrMessage}
            <Button label="Escanear otro código" icon="pi pi-qrcode" className="p-button-success mt-3" onClick={resetScanner} />
          </div>
        </div>
      </Dialog>

      <Dialog header="Registrar venta en puerta" visible={showVentaModal} onHide={() => setShowVentaModal(false)}>
        <div className="flex flex-column gap-3">
          <label>Cantidad de tickets</label>
          <InputNumber value={cantidadVenta} onValueChange={(e) => setCantidadVenta(e.value)} min={1} showButtons />

          <label>Método de pago</label>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="p-inputtext">
            <option value="cash">Cash</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="bitcoin">Bitcoin</option>
          </select>

          <Button label="Guardar venta" icon="pi pi-check" className="p-button-success" onClick={registrarVenta} />
        </div>
      </Dialog>

    </div>
  );
}