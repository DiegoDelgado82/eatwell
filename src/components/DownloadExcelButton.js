// src/components/DownloadExcelButton.js
import React from "react";
import * as XLSX from "xlsx";

function DownloadExcelButton({ registros, cantidades }) {
  // Función para generar y descargar el archivo Excel
  const handleDownload = () => {
    // Filtra los registros que tienen una cantidad ingresada
    const datosFiltrados = registros
      .filter((registro) => cantidades[registro.id] > 0)
      .map((registro) => ({
        Ean: registro.ean,
        Cantidad: cantidades[registro.id],
        Descripcion: registro.Descripcion,
      }));

    // Si no hay datos, muestra un mensaje y no genera el archivo
    if (datosFiltrados.length === 0) {
      alert("No hay registros con cantidades ingresadas.");
      return;
    }

    // Crea una hoja de cálculo con los datos filtrados
    const worksheet = XLSX.utils.json_to_sheet(datosFiltrados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    // Genera el archivo Excel y lo descarga
    XLSX.writeFile(workbook, "Pedidos.xlsx");
  };

  return (
    <button onClick={handleDownload} className="btn btn-success">
      Descargar Excel
    </button>
  );
}

export default DownloadExcelButton;