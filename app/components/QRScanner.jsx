"use client";
import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: 250
      });

      scannerRef.current.render(
        async (decodedText, decodedResult) => {
          if (!decodedText) return;

          try {
            const res = await fetch("/api/verify-ticket", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ securityCode: decodedText }),
            });

            const data = await res.json();
            setMessage(data.message);
            setStatus(data.success ? "success" : "warning");
          } catch (err) {
            setMessage("Error al procesar el código.");
            setStatus("error");
          }
        },
        (errorMessage) => {
          // Opcional: manejar errores de escaneo
        }
      );
    }

    return () => {
      if (scannerRef.current?.clear) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div>
      <h2>Escáner QR</h2>
      <div id="reader" style={{ width: "100%" }}></div>
      {message && (
        <p
          style={{
            color:
              status === "success"
                ? "green"
                : status === "warning"
                ? "orange"
                : "red",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default QRScanner;