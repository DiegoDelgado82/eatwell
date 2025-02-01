// src/components/VerPedidos.js
import React, { useState} from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Dropdown } from 'react-bootstrap';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

function VerPedidos() {
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);

  const sucursales = [
    "Carrefour Colón",
    "Carrefour Jardín",
    "Carrefour Recta",
    "Carrefour Villa",
    "Maxi Juan B Justo",
    "Maxi Cacheuta"
  ];

  const cargarPedidos = async (sucursal) => {
    setLoading(true);
    try {
      // Consulta para buscar por sucursal y ordenar por fecha
      const q = query(
        collection(db, 'pedidos'),
        where('sucursal', '==', sucursal)
      );

      const querySnapshot = await getDocs(q);
      const datos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha.toDate().toLocaleDateString() // Formatear fecha
      }));

      setPedidos(datos);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message.includes('index') 
          ? 'Se requiere crear un índice en Firestore. Haz clic en el enlace del error.'
          : 'No se pudieron cargar los pedidos',
        confirmButtonColor: '#4fc3f7'
      });
    }
    setLoading(false);
  };

  const descargarPedidoExcel = (pedido) => {
    // Preparar datos para el Excel
    const datos = pedido.productos.map(producto => ({
      EAN: producto.ean,
      Descripción: producto.Descripcion,
      Cantidad: producto.Cantidad
    }));

    // Crear el archivo Excel
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(libro, hoja, 'Pedido');

    // Descargar el archivo
    const nombreArchivo = `pedido_${pedido.fecha.replace(/\//g, '-')}_${pedido.sucursal}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
  };

  return (
    <div className="container mt-3">
      <div className="row mb-4">
        <div className="col-md-6">
          <Dropdown>
            <Dropdown.Toggle variant="primary" id="dropdown-sucursales">
              {sucursalSeleccionada || "Seleccionar Sucursal"}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {sucursales.map((sucursal, index) => (
                <Dropdown.Item 
                  key={index}
                  onClick={() => {
                    setSucursalSeleccionada(sucursal);
                    cargarPedidos(sucursal);
                  }}
                >
                  {sucursal}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {loading && <p>Cargando pedidos...</p>}

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="bg-primary text-white">
            <tr>
              <th>Fecha</th>
              <th>Sucursal</th>
              <th>Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>{pedido.fecha}</td>
                <td>{pedido.sucursal}</td>
                <td>
                  <ul className="list-unstyled">
                    {pedido.productos.map((producto, index) => (
                      <li key={index}>
                        {producto.Descripcion} (Cantidad: {producto.Cantidad})
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => descargarPedidoExcel(pedido)}
                  >
                    Descargar Excel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VerPedidos;