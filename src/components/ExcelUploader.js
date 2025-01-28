import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebase"; // Importa la configuración de Firebase
import { collection, addDoc } from "firebase/firestore";

function ExcelUploader() {
  const [data, setData] = useState([]); // Almacena las filas del archivo Excel

  // Maneja la carga del archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryData = event.target.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });
      const sheetName = workbook.SheetNames[0]; // Lee la primera hoja
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet); // Convierte a JSON
      setData(jsonData); // Guarda los datos en el estado
    };
    reader.readAsBinaryString(file); // Lee el archivo como binario
  };

  // Sube los datos a Firestore
  const uploadDataToFirestore = async () => {
    if (data.length === 0) return;

    try {
      for (const row of data) {
        await addDoc(collection(db, "ListaEatwell"), row); // "excelData" es el nombre de la colección
      }
      alert("Datos subidos correctamente a Firestore.");
    } catch (error) {
      console.error("Error al subir los datos:", error);
      alert("Hubo un error al subir los datos.");
    }
  };

  return (
    <div>
      <h2>Cargar archivo de Excel</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <button onClick={uploadDataToFirestore}>Subir datos a Firestore</button>

      <h3>Datos del archivo:</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre> {/* Muestra los datos en pantalla */}
    </div>
  );
}

export default ExcelUploader;