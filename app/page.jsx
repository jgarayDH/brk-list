"use client";
import React, { useState, useEffect } from "react";
import { getSheetData, updateAttendedStatus } from "./services/googleSheetsServices";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { QrReader } from "react-qr-reader";
import "./styles/globals.css";

export default function Home() {
  const [sheetData, setSheetData] = useState([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getSheetData("undermotion");
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

  // Función para manejar el escaneo de QR
  const handleScan = async (result) => {
    if (result?.text) {
      const scannedData = result.text.split(",");
      const rowNumber = scannedData[0]; // Suponiendo que el QR contiene el ID del invitado en la hoja

      // Buscar al invitado en la hoja
      const invitedGuest = sheetData.find((guest) => guest.id === rowNumber);

      if (invitedGuest) {
        if (invitedGuest.attended === "true") {
          setQrMessage("❌ Este ticket ya fue registrado.");
        } else {
          await updateAttendedStatus(rowNumber, "true");
          setQrMessage("✅ Ticket registrado correctamente.");
          fetchData(); // Recargar la tabla con los datos actualizados
        }
      } else {
        setQrMessage("❌ Código QR inválido.");
      }
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
      <Dialog header="Escanear Código QR" visible={showQRModal} style={{ width: "50vw" }} onHide={() => setShowQRModal(false)}>
        <QrReader onResult={handleScan} style={{ width: "100%" }} />
        <p className="text-center font-bold">{qrMessage}</p>
        <Button label="Cerrar" icon="pi pi-times" className="p-button-secondary w-full mt-3" onClick={() => setShowQRModal(false)} />
      </Dialog>
    </div>
  );
}