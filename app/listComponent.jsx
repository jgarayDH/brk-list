"use client";
import React, { useState, useEffect } from 'react';
import { getSheetData } from "./google-sheets.action";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

export default function ParticipantList() {
  const [sheetData, setSheetData] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    nombre: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getSheetData();
        setSheetData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sheet data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };

    _filters['nombre'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const clearInput = () => {
    setGlobalFilterValue('');
    setFilters({ ...filters, nombre: { value: null } });
  };

  const handleTicketChange = (rowData, newValue) => {
    // Verificar que la cantidad de tickets utilizados no sea mayor que la cantidad de tickets disponibles
    if (newValue >= 0 && newValue <= rowData.cantidad) {
      // Actualizar el valor de tickets utilizados
      rowData.utilizados = newValue;

      // Realizar la actualización en el backend (por ejemplo, llamando a una función API)
      // ...

      // Actualizar el estado local para que se refleje en la interfaz de usuario
      setSheetData([...sheetData]);
    }
  };

  const ticketCountTemplate = (rowData) => {
    const isMaxTicketsReached = rowData.utilizados === rowData.cantidad;
    const boletosDisponibles = rowData.cantidad - rowData.utilizados;

    return (
      <div className='flex justify-content-between align-items-center'>
        <span className='mr-5'>Disponibles: <span className='font-bold'>{boletosDisponibles}</span></span>
  
        <InputNumber
          value={rowData.utilizados}
          onValueChange={(e) => handleTicketChange(rowData, e.value)}
          showButtons
          buttonLayout="horizontal"
          step={1}
          decrementButtonClassName="p-button-danger"
          min={0}
          max={rowData.cantidad}
          incrementButtonClassName="p-button-success"
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
          inputClassName='w-3rem text-center'
          disabled={isMaxTicketsReached} // Deshabilitar si se alcanza la cantidad máxima de boletos
        />
      </div>
    );
  };

  const totalTicketsUsed = sheetData.reduce((total, rowData) => total + rowData.utilizados, 0);

  return (
    <div className='p-2'>
      <h1 className='mb-0'>THE UNDERMOTION - 24.02.24</h1>
      <p className='mt-1 text-right'>Boletos utilizados: <span className='font-bold '>{totalTicketsUsed}</span></p>

      <div className='w-100 flex pb-3'>
        <InputText className='w-full' value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Buscar por nombre" />
        <Button icon="pi pi-refresh" label='Limpiar' className="ml-3" onClick={clearInput} />
      </div>

      <DataTable value={sheetData} paginator rows={50} filters={filters} loading={loading} dataKey="id" tableStyle={{ minWidth: '50rem' }}>
        <Column field="nombre" header="Nombre"></Column>
        <Column field="tipo" header="Tipo"></Column>
        <Column field="socio" header="Socio"></Column>
        <Column field="utilizados" header="Boletos" body={ticketCountTemplate}></Column>
      </DataTable>
    </div>
  );
}