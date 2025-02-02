// src/components/ListaEatwellTable.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { BounceLoader } from 'react-spinners';
import DownloadExcelButton from './DownloadExcelButton';
import { Form } from 'react-bootstrap';
import '../styles.css';

function ListaEatwellTable() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cantidades, setCantidades] = useState({});
  const [sucursal, setSucursal] = useState('');

  const sucursales = [
    "Carrefour Colón",
    "Carrefour Jardín",
    "Carrefour Recta",
    "Carrefour Villa",
    "Maxi Juan B Justo",
    "Maxi Cacheuta"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ListaEatwell'));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ean: doc.data().ean.toString() // Asegurar que ean sea string
        }));
        data.sort((a, b) => a.pos - b.pos);
        setRegistros(data);
      } catch (error) {
        console.error("Error al cargar los registros:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudieron cargar los productos',
          confirmButtonColor: '#4fc3f7'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCantidadChange = (id, value) => {
    const cantidad = parseInt(value, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      setCantidades(prev => ({ ...prev, [id]: cantidad }));
    }
  };

  const guardarPedido = async () => {
    const pedido = registros
      .filter(registro => cantidades[registro.id] > 0)
      .map(registro => ({
        ean: registro.ean,
        Descripcion: registro.Descripcion,
        Cantidad: cantidades[registro.id]
      }));

    if (pedido.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Pedido vacío',
        text: 'No has seleccionado ningún producto',
        confirmButtonColor: '#4fc3f7'
      });
      return;
    }

    if (!sucursal) {
      Swal.fire({
        icon: 'error',
        title: 'Sucursal no seleccionada',
        text: 'Debes seleccionar una sucursal antes de guardar el pedido',
        confirmButtonColor: '#4fc3f7'
      });
      return;
    }

    try {
      const fecha = new Date();
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const año = fecha.getFullYear();
      const nombreDocumento = `pedido${dia}-${mes}-${año} ${sucursal}`;

      await addDoc(collection(db, 'pedidos'), {
        nombre: nombreDocumento,
        sucursal: sucursal,
        productos: pedido,
        fecha: new Date()
      });

      Swal.fire({
        icon: 'success',
        title: 'Pedido guardado',
        text: `Pedido registrado para ${sucursal}`,
        confirmButtonColor: '#4fc3f7'
      });

      setCantidades({}); // Limpiar cantidades
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el pedido',
        confirmButtonColor: '#4fc3f7'
      });
      console.error('Error al guardar el pedido:', error);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <BounceLoader color="#4fc3f7" size={80} speedMultiplier={1.5} />
        <p className="loading-text">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="mb-3">
        <Form.Select
          value={sucursal}
          onChange={(e) => setSucursal(e.target.value)}
        >
          <option value="">Seleccionar sucursal</option>
          {sucursales.map((sucursal, index) => (
            <option key={index} value={sucursal}>
              {sucursal}
            </option>
          ))}
        </Form.Select>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-striped table-hover">
          <thead className="custom-thead">
            <tr>
              <th className="text-center">Ean</th>
              <th className="text-center">Descripción</th>
              <th className="text-center">UC</th>
              <th className="text-center">Cant</th>
            </tr>
          </thead>
          <tbody>
            {registros.map(registro => (
              <tr key={registro.id} className="text-center">
                <td className="align-middle">{registro.ean}</td>
                <td className="align-middle">{registro.Descripcion}</td>
                <td className="align-middle">{registro.UC}</td>
                <td className="align-middle">
                  <input
                    type="number"
                    min="1"
                    style={{ width: '60px' }}
                    value={cantidades[registro.id] || ''}
                    onChange={(e) => handleCantidadChange(registro.id, e.target.value)}
                    className="form-control form-control-sm mx-auto"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-center gap-2 my-3">
        <button
          onClick={guardarPedido}
          className="btn btn-primary px-4 py-2"
          disabled={!sucursal}
        >
          Guardar Pedido
        </button>
        <DownloadExcelButton
          registros={registros}
          cantidades={cantidades}
          sucursal={sucursal}
        />
      </div>
    </div>
  );
}

export default ListaEatwellTable;