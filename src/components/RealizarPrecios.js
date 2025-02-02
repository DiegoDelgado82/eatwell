// src/components/RealizarPrecios.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Table, Form } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../styles.css';

function RealizarPrecios() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cantidad, setCantidad] = useState(() => {
    const guardado = localStorage.getItem('precios');
    return guardado ? JSON.parse(guardado) : [];
  });

  // Cargar items desde Firestore
  useEffect(() => {
    const cargarItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ListaEatwell'));
        const datos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ean: doc.data().ean.toString()
        }));
        setItems(datos);
      } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      }
    };
    cargarItems();
  }, []);

  // Búsqueda en tiempo real
  useEffect(() => {
    const resultados = items.filter(item =>
      item.Descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.ean.includes(busqueda)
    );
    setResultados(resultados.slice(0, 5));
  }, [busqueda, items]);

  // Sincronizar con localStorage
  useEffect(() => {
    localStorage.setItem('cantidad', JSON.stringify(cantidad));
  }, [cantidad]);

  const agregarItem = (item) => {
    if (!cantidad.some(p => p.id === item.id)) {
      setCantidad([...cantidad, { ...item, cantidad: '' }]);
    }
    setBusqueda('');
  };

  const eliminarItem = (id) => {
    setCantidad(cantidad.filter(item => item.id !== id));
  };

  const actualizarPrecio = (id, nuevoCantidad) => {
    setCantidad(cantidad.map(item => 
      item.id === id ? { ...item, cantidad: nuevoCantidad } : item
    ));
  };

  const descargarExcel = () => {
    if (cantidad.length === 0) {
      Swal.fire('Error', 'Agrega al menos un precio', 'warning');
      return;
    }

    const datos = cantidad.map(item => ({
      EAN: item.ean,
      Cantidad: item.cantidad,
      Descripción: item.Descripcion
        }));

    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(libro, hoja, 'Precios');
    XLSX.writeFile(libro, 'precios.xlsx');
    
    localStorage.removeItem('precios');
    setCantidad([]);
  };

  return (
    <div className="container-fluid p-4">
      {/* Campo de búsqueda */}
      <div className="row mb-4">
        <div className="col-12">
          <Form.Control
            type="text"
            placeholder="🔍 Buscar por EAN o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
          
          {busqueda && (
            <div className="autocomplete-results">
              {resultados.map(item => (
                <div
                  key={item.id}
                  className="autocomplete-item"
                  onClick={() => agregarItem(item)}
                >
                  <span className="ean">{item.ean}</span>
                  <span className="desc">{item.Descripcion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de precios */}
      <Table striped bordered hover className="full-width-table">
        <thead className="table-header">
          <tr>
            <th className="text-center">EAN</th>
            <th className="text-center">Descripción</th>
            <th className="text-center">Cant</th>
            <th className="text-center"></th>
          </tr>
        </thead>
        <tbody>
          {cantidad.map(item => (
            <tr key={item.id}>
              <td className="align-middle">{item.ean}</td>
              <td className="align-middle">{item.Descripcion}</td>
              <td className="align-middle">
                <Form.Control
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => actualizarPrecio(item.id, e.target.value)}
                  step="1"
                  min="0"
                  className="price-input"
                />
              </td>
              <td className="text-center align-middle">
                <FaTrash 
                  className="trash-icon"
                  onClick={() => eliminarItem(item.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Botón de descarga */}
      <div className="text-center mt-4">
        <button 
          className="download-button"
          onClick={descargarExcel}
          disabled={cantidad.length === 0}
        >
          Descargar Lista de Precios
        </button>
      </div>
    </div>
  );
}

export default RealizarPrecios;