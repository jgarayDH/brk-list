"use client";
import React, { useState } from "react";
import { QrReader } from "react-qr-reader";
import { updateAttendedStatus } from "../services/googleSheetsService";

const QRScanner = () => {
  const [message, setMessage] = useState("");

  const handleScan = async (result) => {
    if (result) {
      const { data } = result;
      const [row, attended] = data.split(","); // Ajusta según tu formato QR

      if (attended === "true") {
        setMessage("Error: Este ticket ya fue registrado.");
      } else {
        await updateAttendedStatus(row, "true");
        setMessage("Éxito: Ticket registrado correctamente.");
      }
    }
  };

  return (
    <div>
      <h2>Escáner QR</h2>
      <QrReader onResult={handleScan} style={{ width: "100%" }} />
      <p>{message}</p>
    </div>
  );
};

export default QRScanner;