"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";

import "./styles/globals.css";

// Scanner solo cliente
const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then(m => m.Scanner), { ssr: false });

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrMessage, setQrMessage] = useState("");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name:   { value: null, matchMode: FilterMatchMode.CONTAINS }, // usa "name", no "nombre"
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [showVentaModal, setShowVentaModal] = useState(false);
  const [cantidadVenta, setCantidadVenta] = useState(1);
  const [metodoPago, setMetodoPago] = useState("cash");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (qrData && !isProcessing) {
      validateTicket();
    }
  }, [qrData]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guests?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSheetData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error fetching sheet data:", error);
      setSheetData([]); // guard
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
        setQrMessage("❌ No se pudo leer el código QR.");
        setTimeout(resetScanner, 3000);
        return;
      }

      const scannedValue = qrData[0]?.rawValue;

      if (isUrlQrCode(scannedValue)) {
        // TICKET (URL)
        const url = new URL(scannedValue);
        const securityCode = url.searchParams.get("security_code");
        const response = await fetch(`/api/verify-ticket?t=${Date.now()}`, {
          method: "POST",
          body: JSON.stringify({ securityCode }),
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          cache: "no-store",
        });
        const { success, message, ticket } = await response.json();

        if (success) {
          setTicketInfo(ticket);
          setQrMessage("✅ Ticket válido.");
          // pequeño delay para que Sheets persista
          await new Promise(r => setTimeout(r, 300));
          await fetchData();
        } else {
          setTicketInfo(ticket || null);
          setQrMessage(`❌ ${message}`);
        }
      } else {
        // INVITADO (GUEST)
        const codigo = scannedValue;
        const response = await fetch(`/api/verify-guest?t=${Date.now()}`, {
          method: "POST",
          body: JSON.stringify({ codigo }),
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          cache: "no-store",
        });
        const { success, message, guest } = await response.json();

        if (success) {
          setTicketInfo(guest);
          setQrMessage("✅ Invitado válido.");
          await new Promise(r => setTimeout(r, 300));
          await fetchData();
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

  // Actualizar utilizados (columna F) — luego refrescamos lista sin caché
  const handleTicketChange = async (rowData, newValue) => {
    const cantidad = Number(rowData.cantidad ?? 0);
    const utilizados = Number(rowData.utilizados ?? 0);

    // Solo permitir INCREMENTO
    if (Number(newValue) === utilizados + 1 && newValue <= cantidad) {
      const rowNumber = (sheetData || []).findIndex(row => row.id === rowData.id) + 2;
      try {
        await fetch(`/api/update-utilizados?t=${Date.now()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          cache: "no-store",
          body: JSON.stringify({
            sheetName: "Guests",
            column: "F",
            rowNumber,
            newValue,
          }),
        });
        await new Promise(r => setTimeout(r, 300));
        await fetchData();
      } catch (error) {
        console.error("❌ Error al actualizar boletos:", error);
      }
    }
  };

  // SOLO SUMAR: sin botón de restar, sin tipeo manual, min = valor actual
// 🔁 Reemplaza tu ticketCountTemplate por este:
const ticketCountTemplate = (rowData = {}) => {
  const cantidad = Number(rowData.cantidad ?? 0);
  const utilizados = Number(rowData.utilizados ?? 0);
  const disponibles = Math.max(cantidad - utilizados, 0);

  const handleIncrement = async () => {
    if (utilizados < cantidad) {
      // Suma exactamente +1 usando tu API existente
      await handleTicketChange(rowData, utilizados + 1);
    }
  };

  return (
    <div
      className="flex justify-content-between align-items-center"
      role="group"
      aria-label={`Control de tickets para ${rowData.name || "invitado"}`}
    >
      <span className="mr-5">
        Disponibles: <span className="font-bold">{disponibles}</span>
      </span>

      <div className="flex align-items-center gap-2">
        {/* Muestra el usado actual, solo lectura y accesible */}
        <output
          className="w-3rem text-center"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Tickets usados"
        >
          {utilizados}
        </output>

        {/* ÚNICO control: botón de sumar */}
        <Button
          icon="pi pi-plus"
          aria-label="Agregar un ticket usado"
          onClick={handleIncrement}
          disabled={utilizados >= cantidad}  // desactiva al llegar al máximo
        />
      </div>
    </div>
  );
};

  const totalTicketsUsed = (Array.isArray(sheetData) ? sheetData : [])
    .reduce((total, row = {}) => total + Number(row.utilizados ?? 0), 0);

  const totalTicketsAvailable = (Array.isArray(sheetData) ? sheetData : [])
    .reduce((total, row = {}) => {
      const cant = Number(row.cantidad ?? 0);
      const used = Number(row.utilizados ?? 0);
      return total + Math.max(cant - used, 0);
    }, 0);

  const onGlobalFilterChange = (e) => {
    const value = e?.target?.value ?? "";
    setFilters(prev => ({ ...prev, global: { ...prev.global, value } }));
    setGlobalFilterValue(value);
  };

  const clearInput = () => {
    setGlobalFilterValue("");
    setFilters(prev => ({
      ...prev,
      name: { ...prev.name, value: null },
      global: { ...prev.global, value: null },
    }));
  };

  const isTicketUsed = (ticket) => {
    if ("attended" in (ticket || {})) return ticket.attended === "TRUE";
    const cant = Number(ticket?.cantidad ?? 0);
    const used = Number(ticket?.utilizados ?? 0);
    return used >= cant;
  };

  const registrarVenta = async () => {
    try {
      const response = await fetch(`/api/add-door-sale?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        cache: "no-store",
        body: JSON.stringify({ cantidad: cantidadVenta, metodoPago }),
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

      <div className="mt-1 text-right flex gap-4 justify-content-end">
        <span>🎟️ <strong>Total boletos utilizados:</strong> {totalTicketsUsed}</span>
        <span>🎫 <strong>Total boletos disponibles:</strong> {totalTicketsAvailable}</span>
      </div>

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

      <DataTable
        value={Array.isArray(sheetData) ? sheetData : []}
        paginator
        rows={50}
        filters={filters ?? {}}
        globalFilterFields={["name", "codigo", "tipo_entrada"]}
        loading={!!loading}
        dataKey="id"
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column field="name" header="Nombre" />
        <Column field="codigo" header="Codigo" />
        <Column field="tipo_entrada" header="Tipo de entrada" />
        <Column field="utilizados" header="Tickets disponibles" body={ticketCountTemplate} />
      </DataTable>

      <Dialog header="Escanear Código QR" visible={showQRModal} onHide={closeModal} className="qr-dialog">
        <div className="qr-scanner-container">
          {scannerActive && !loadingQR && !ticketInfo && (
            <Scanner
              onScan={(result) => setQrData(result)}
              onError={(error) => console.error("❌ Error escaneando:", error)}
              constraints={{ facingMode: "environment" }}
              style={{ width: "100%", height: "100vh" }}
            />
          )}

          {loadingQR && (
            <div className="loading-screen">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: "3rem", color: "white" }} />
              <p className="qr-message">Validando ticket...</p>
            </div>
          )}

          {ticketInfo && qrMessage.startsWith("✅") && (
            <div className="ticket-info bg-white">
              <h2>🎟️ Ticket Escaneado correctamente</h2>
              <p><strong>Nombre:</strong> {ticketInfo.name}</p>
              <p><strong>Producto:</strong> {ticketInfo.producto || "Cortesía"}</p>
              <p><strong>Order ID:</strong> {ticketInfo.order_id || "N/A"}</p>
              <p><strong>Estado:</strong> {isTicketUsed(ticketInfo) ? "⚠️ Usado" : "✅ Válido"}</p>
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