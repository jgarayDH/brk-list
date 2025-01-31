import React, { useState, useEffect } from "react";
import { DataTable as PrimeDataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const DataTable = ({ fetchSheetData }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchSheetData();
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, [fetchSheetData]);

  return (
    <PrimeDataTable value={data} paginator rows={10} loading={loading}>
      <Column field="nombre" header="Nombre"></Column>
      <Column field="attended" header="Asistencia"></Column>
    </PrimeDataTable>
  );
};

export default DataTable;