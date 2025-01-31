"use client";
import React, { useState, useEffect } from "react";
import { getSheetData } from "./services/googleSheetsServices";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { QrReader } from "react-qr-reader";
import "./styles/globals.css";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false); // 🔹 Bloquea escaneos repetidos
  const [loadingQR, setLoadingQR] = useState(false);
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
  const [disableScanner, setDisableScanner] = useState(false); // 🔹 Para desactivar la cámara después de un escaneo

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getSheetData("Tickets");
      setSheetData(response);
    } catch (error) {
      console.error("Error fetching sheet data:", error);
    }
    setLoading(false);
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["nombre"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const clearInput = () => {
    setGlobalFilterValue("");
    setFilters({ ...filters, nombre: { value: null } });
  };

  const handleScan = async (result) => {
    if (result?.text && !isProcessing) {
      setIsProcessing(true); // 🔹 Evita múltiples peticiones
      setDisableScanner(true); // 🔹 Apaga la cámara temporalmente
      setLoadingQR(true); // 🔹 Activa el estado de carga

      try {
        const url = new URL(result.text);
        const params = new URLSearchParams(url.search);
        const securityCode = params.get("security_code");

        if (!securityCode) {
          setQrMessage("❌ Código QR inválido.");
          setTimeout(() => {
            setIsProcessing(false);
            setDisableScanner(false); // 🔹 Reactiva la cámara después de un tiempo
          }, 3000);
          return;
        }

        console.log("Security Code:", securityCode);

        // 🔹 Solo una petición por escaneo
        const response = await fetch("/api/verify-ticket", {
          method: "POST",
          body: JSON.stringify({ securityCode }),
          headers: { "Content-Type": "application/json" },
        });

        const { success, message, ticket } = await response.json();

        if (success) {
          setQrMessage("✅ Ticket registrado correctamente.");
          setTicketInfo(ticket); // 🔹 Guardar datos del ticket
          fetchData(); // 🔹 Recargar la tabla con los datos actualizados
        } else {
          setQrMessage(`❌ ${message}`);
        }
      } catch (error) {
        setQrMessage("❌ Error procesando el código QR.");
        console.error(error);
      }

      setLoadingQR(false); // 🔹 Oculta la pantalla de carga
      setTimeout(() => {
        setIsProcessing(false);
        setDisableScanner(false); // 🔹 Reactivar el escáner después de un tiempo
      }, 3000);
    }
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
          onChange={onGlobalFilterChange}
          placeholder="Buscar por nombre"
        />
        <Button icon="pi pi-refresh" label="Recargar" onClick={fetchData} disabled={loading} />
        <Button icon="pi pi-times" label="Limpiar" onClick={clearInput} />
        <Button icon="pi pi-qrcode" label="Escanear QR" onClick={() => setShowQRModal(true)} />
      </div>

      {/* TABLA DE INVITADOS */}
      <DataTable value={sheetData} paginator rows={50} filters={filters} loading={loading} dataKey="id" tableStyle={{ minWidth: "50rem" }}>
        <Column field="nombre" header="Nombre"></Column>
        <Column field="tier" header="Tier"></Column>
        <Column field="tipo" header="Tipo"></Column>
        <Column field="socio" header="Socio"></Column>
        <Column field="attended" header="Asistencia" body={(rowData) => (rowData.attended === "true" ? "✅ Sí" : "❌ No")}></Column>
      </DataTable>

      {/* MODAL PARA ESCANEAR CÓDIGO QR */}
      <Dialog
        header="Escanear Código QR"
        visible={showQRModal}
        style={{ width: "100vw", height: "100vh", maxWidth: "100%", maxHeight: "100%" }}
        onHide={() => {
          setShowQRModal(false);
          setTicketInfo(null);
          setIsProcessing(false);
          setDisableScanner(false);
        }}
        className="qr-dialog"
      >
        <div className="qr-scanner-container">
          {/* Mostrar QR Scanner solo si no está procesando */}
          {!loadingQR && !ticketInfo && !disableScanner && (
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: "environment" }} // Usa la cámara trasera
              containerStyle={{ width: "100%", height: "100%" }}
            />
          )}

          {/* Pantalla de Cargando */}
          {loadingQR && (
            <div className="loading-screen">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: "3rem", color: "white" }}></i>
              <p className="qr-message">Validando ticket...</p>
            </div>
          )}

          {/* Mostrar información del Ticket después de escanear */}
          {ticketInfo && (
            <div className="ticket-info">
              <h2>🎟️ Ticket Escaneado</h2>
              <p><strong>Nombre:</strong> {ticketInfo.name}</p>
              <p><strong>Producto:</strong> {ticketInfo.producto}</p>
              <p><strong>Order ID:</strong> {ticketInfo.order_id}</p>
              <p><strong>Estado:</strong> ✅ Usado</p>
            </div>
          )}

          <p className="qr-message">{qrMessage}</p>

          <Button label="Cerrar" icon="pi pi-times" className="p-button-secondary close-btn"
            onClick={() => {
              setShowQRModal(false);
              setTicketInfo(null);
              setIsProcessing(false);
              setDisableScanner(false);
            }}
          />
        </div>
      </Dialog>
    </div>
  );
}