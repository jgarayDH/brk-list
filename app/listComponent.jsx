"use client";
import React, { useState, useEffect } from 'react';
import { getSheetData } from "./google-sheets.action";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { updateRowData, updateCellValue } from './google-sheets-update';

export default function ParticipantList() {
  const [sheetData, setSheetData] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    nombre: { value: null, matchMode: FilterMatchMode.CONTAINS },
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

  const handleTicketChange = async (rowData, newValue) => {

    let id = Number(rowData.id) + 1;
    console.log(id)

    // Verificar que la cantidad de tickets utilizados no sea mayor que la cantidad de tickets disponibles
    if (newValue >= 0 && newValue <= rowData.cantidad) {
      // Actualizar el valor de tickets utilizados
      rowData.utilizados = newValue;
      
      // Realizar la actualización en el backend (por ejemplo, llamando a una función API)
      await updateCellValue(id, 6, newValue);

      const updatedData = await getSheetData();

      // Actualizar el estado local para que se refleje en la interfaz de usuario
      setSheetData(updatedData.data);
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
          min={0}
          max={rowData.cantidad}
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
          inputClassName='w-3rem text-center'
          disabled={isMaxTicketsReached} // Deshabilitar si se alcanza la cantidad máxima de boletos
        />
      </div>
    );
  };

  const totalTicketsUsed = sheetData.reduce((total, rowData) => total + rowData.utilizados, 0);

  const fetchData = async () => {
    try {
      setLoading(true); // Indicar que se está cargando
      const response = await getSheetData();
      setSheetData(response.data);
      setLoading(false); // Indicar que la carga ha terminado
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      setLoading(false); // Asegurarse de indicar que la carga ha terminado en caso de error
    }
  };

  return (
    <div className='p-2'>
      <h1 className='mb-0'>THE UNDERMOTION - 24.02.24</h1>
      <p className='mt-1 text-right'>Boletos utilizados: <span className='font-bold '>{totalTicketsUsed}</span></p>

      <div className='flex flex-column sm:flex-row pb-3 gap-3'>
        <InputText className='w-12 sm:w-6 md:w-10 flex' value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Buscar por nombre" />
        <Button icon="pi pi-refresh" label='Recargar' severity="secondary"  onClick={fetchData} disabled={loading} />
        <Button icon="pi pi-refresh" label='Limpiar' onClick={clearInput} />
      </div>

      <DataTable value={sheetData} paginator rows={50} filters={filters} loading={loading} dataKey="id" tableStyle={{ minWidth: '50rem' }}>
        <Column field="nombre" header="Nombre"></Column>
        <Column field='tier' header="Tier"></Column>
        <Column field="tipo" header="Tipo"></Column>
        <Column field="socio" header="Socio"></Column>
        <Column field="utilizados" header="Boletos" body={ticketCountTemplate}></Column>
      </DataTable>
    </div>
  );
}