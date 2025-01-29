// src/components/VerPedidos.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx"; // Importa la librería xlsx

function VerPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detallePedido, setDetallePedido] = useState(null);

  // Cargar la lista de pedidos al montar el componente
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const pedidosFiltrados = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPedidos(pedidosFiltrados);
      } catch (error) {
        console.error("Error al cargar los pedidos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  // Cargar el detalle de un pedido específico
  const cargarDetallePedido = (pedido) => {
    setDetallePedido(pedido);
  };

  // Función para descargar el Excel
  const handleDownloadExcel = () => {
    if (!detallePedido || detallePedido.productos.length === 0) {
      alert("No hay datos para descargar.");
      return;
    }

    // Formatea los datos para el Excel
    const datosExcel = detallePedido.productos.map((producto) => ({
      Ean: producto.ean,
      Cantidad: producto.Cantidad,
      Descripcion: producto.Descripcion,
    }));

    // Crea la hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedido");

    // Genera el archivo Excel
    XLSX.writeFile(workbook, `${detallePedido.nombre}.xlsx`);
  };

  if (loading) {
    return <p>Cargando pedidos...</p>;
  }

  return (
    <div>
      <h2>Pedidos Realizados</h2>
      <ul>
        {pedidos.map((pedido) => (
          <li key={pedido.id}>
            <button
              onClick={() => cargarDetallePedido(pedido)}
              className="btn btn-link"
            >
              {pedido.nombre}
            </button>
          </li>
        ))}
      </ul>

      {detallePedido && (
        <div>
          <h3>Detalle del pedido: {detallePedido.nombre}</h3>
          <button onClick={handleDownloadExcel} className="btn btn-success mb-3">
            Descargar Excel
          </button>
          <table border="1" cellPadding="10" cellSpacing="0">
            <thead>
              <tr>
                <th>Ean</th>
                <th>Descripción</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {detallePedido.productos.map((producto, index) => (
                <tr key={index}>
                  <td>{producto.ean}</td>
                  <td>{producto.Descripcion}</td>
                  <td>{producto.Cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VerPedidos;