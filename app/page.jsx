"use client";
import React, { useState, useEffect } from "react";
import { getSheetData } from "./services/googleSheetsServices";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import dynamic from "next/dynamic"; // ✅ Evita errores SSR
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (qrData && !isProcessing) {
      validateTicket();
    }
  }, [qrData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener datos de la pestaña "undermotion"
      const undermotionData = await getSheetData("undermotion");
      
      // Obtener datos de la pestaña "Tickets"
      const ticketsData = await getSheetData("Tickets");
  
      // ✅ Separar la data correctamente
      setSheetData(undermotionData);  // Para la tabla de invitados
      setTicketsData(ticketsData);    // Para la validación de QR
  
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

  const validateTicket = async () => {
    setIsProcessing(true);
    setScannerActive(false);
    setLoadingQR(true);

    try {
      console.log("📡 Escaneado:", qrData);

      if (!qrData || !Array.isArray(qrData) || qrData.length === 0) {
        console.error("❌ No se obtuvo código QR.");
        setQrMessage("❌ No se pudo leer el código QR.");
        setTimeout(() => resetScanner(), 3000);
        return;
      }

      const scannedUrl = qrData[0]?.rawValue;
      console.log("🔗 URL extraída:", scannedUrl);

      if (!scannedUrl || typeof scannedUrl !== "string") {
        console.error("❌ URL inválida.");
        setQrMessage("❌ Código QR inválido.");
        setTimeout(() => resetScanner(), 3000);
        return;
      }

      let url;
      try {
        url = new URL(scannedUrl);
        console.log("✅ URL válida:", url.href);
      } catch (error) {
        console.error("❌ Error al convertir URL:", error);
        setQrMessage("❌ Código QR inválido.");
        setTimeout(() => resetScanner(), 3000);
        return;
      }

      const params = new URLSearchParams(url.search);
      const securityCode = params.get("security_code");
      console.log("🔑 Security Code Extraído:", securityCode);

      if (!securityCode) {
        console.error("❌ Security Code no encontrado.");
        setQrMessage("❌ Código QR inválido.");
        setTimeout(() => resetScanner(), 3000);
        return;
      }

      console.log("📨 Enviando Security Code a la API:", securityCode);

      const response = await fetch("/api/verify-ticket", {
        method: "POST",
        body: JSON.stringify({ securityCode }),
        headers: { "Content-Type": "application/json" },
      });

      const { success, message, ticket } = await response.json();

      if (success) {
        console.log("✅ Ticket válido:", ticket);
        setQrMessage("");
        setTicketInfo(ticket);
        fetchData();
      } else {
        console.warn("⚠️ Ticket ya escaneado:", message);
        if (ticket) {
          setTicketInfo(ticket);
          setQrMessage("⚠️ Este ticket ya ha sido utilizado.");
        } else {
          setQrMessage(`❌ ${message}`);
        }
      }
    } catch (error) {
      console.error("❌ Error procesando QR:", error);
      setQrMessage("❌ Error procesando el código QR.");
    }

    setLoadingQR(false);
    setIsProcessing(false);
  };

  return (
    <div className="p-2">
      <h1 className="mb-3">Mixmag Latam - BRK | Eternals 18.01.25</h1>
      <p className="mt-1 text-right">
        Boletos utilizados: <span className="font-bold">{sheetData.filter((row) => row.attended === "true").length}</span>
      </p>

      <div className="flex flex-column sm:flex-row pb-3 gap-3">
        <InputText
          className="w-12 sm:w-6 md:w-10 flex"
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Buscar por nombre"
        />
        <Button icon="pi pi-refresh" label="Recargar" onClick={fetchData} disabled={loading} />
        <Button icon="pi pi-times" label="Limpiar" onClick={resetScanner} />
        <Button icon="pi pi-qrcode" label="Escanear QR" onClick={() => setShowQRModal(true)} />
      </div>

      <DataTable value={sheetData} paginator rows={50} filters={filters} loading={loading} dataKey="id" tableStyle={{ minWidth: "50rem" }}>
        <Column field="nombre" header="Nombre" />
        <Column field="tier" header="Tier" />
        <Column field="tipo" header="Tipo" />
        <Column field="socio" header="Socio" />
        <Column field="attended" header="Asistencia" body={(rowData) => (rowData.attended === "true" ? "✅ Sí" : "❌ No")} />
      </DataTable>

      <Dialog header="Escanear Código QR" visible={showQRModal} onHide={closeModal} className="qr-dialog">
        <div className="qr-scanner-container">
          {scannerActive && !loadingQR && !ticketInfo && (
            <Scanner
              onScan={(result) => setQrData(result)}
              onError={(error) => console.error("Error escaneando:", error)}
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

          {ticketInfo && (
            <div className="ticket-info">
              <h2>🎟️ Ticket Escaneado correctamente :)</h2>
              <p><strong>Nombre:</strong> {ticketInfo.name}</p>
              <p><strong>Producto:</strong> {ticketInfo.producto}</p>
              <p><strong>Order ID:</strong> {ticketInfo.order_id}</p>
              <p><strong>Estado:</strong> {ticketInfo.attended === "TRUE" ? "⚠️ Usado" : "✅ Válido"}</p>

              <Button label="Escanear otro código" icon="pi pi-qrcode" className="p-button-success mt-3" onClick={resetScanner} />
            </div>
          )}

          <p className="qr-message">{qrMessage}</p>
        </div>
      </Dialog>
    </div>
  );
}