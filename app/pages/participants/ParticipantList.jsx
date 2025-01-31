"use client";
import React, { useState } from "react";
import { getSheetData } from "../services/googleSheetsService";
import DataTable from "../components/DataTable";

const ParticipantList = () => {
  const [sheetName, setSheetName] = useState("undermotion");

  const fetchSheetData = async () => {
    return await getSheetData(sheetName);
  };

  return (
    <div>
      <h1>Lista de Participantes</h1>
      <select onChange={(e) => setSheetName(e.target.value)}>
        <option value="undermotion">Undermotion</option>
        <option value="otraPestaña">Otra Pestaña</option>
      </select>
      <DataTable fetchSheetData={fetchSheetData} />
    </div>
  );
};

export default ParticipantList;