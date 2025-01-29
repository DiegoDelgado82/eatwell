// src/components/ListaEatwellTable.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import DownloadExcelButton from "./DownloadExcelButton"; // Importa el nuevo componente

function ListaEatwellTable() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cantidades, setCantidades] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ListaEatwell"));
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRegistros(data);
      } catch (error) {
        console.error("Error al cargar los registros:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCantidadChange = (id, value) => {
    const cantidad = parseInt(value, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      setCantidades({ ...cantidades, [id]: cantidad });
    }
  };

  if (loading) {
    return <p>Cargando registros...</p>;
  }

  return (
    <div>
      <h2>Registros de ListaEatwell</h2>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Ean</th>
            <th>Descripción</th>
            <th>UC</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <tr key={registro.id}>
              <td>{registro.ean}</td>
              <td>{registro.Descripcion}</td>
              <td>{registro.UC}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={cantidades[registro.id] || ""}
                  onChange={(e) => handleCantidadChange(registro.id, e.target.value)}
                  placeholder="Ingrese cantidad"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <DownloadExcelButton registros={registros} cantidades={cantidades} />
    </div>
  );
}

export default ListaEatwellTable;