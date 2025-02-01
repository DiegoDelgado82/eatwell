// src/components/RealizarPrecios.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Button, Table, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';

function RealizarPrecios() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [precios, setPrecios] = useState(() => {
    const guardado = localStorage.getItem('precios');
    return guardado ? JSON.parse(guardado) : [];
  });

  // Cargar items iniciales desde Firestore
  useEffect(() => {
    const cargarItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ListaEatwell'));
        const datos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ean: doc.data().ean.toString() // Asegurar que ean sea string
        }));
        setItems(datos);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los productos',
          confirmButtonColor: '#4fc3f7'
        });
        console.error('Error al cargar items:', error);
      }
    };
    cargarItems();
  }, []);

  // Buscar coincidencias en tiempo real
  useEffect(() => {
    if (busqueda.trim() === '') {
      setResultados([]);
      return;
    }

    const resultados = items.filter(item =>
      item.Descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.ean.includes(busqueda)
    );
    setResultados(resultados.slice(0, 5)); // Limitar a 5 resultados
  }, [busqueda, items]);

  // Sincronizar con localStorage
  useEffect(() => {
    localStorage.setItem('precios', JSON.stringify(precios));
  }, [precios]);

  // Agregar item a la tabla de precios
  const agregarItem = (item) => {
    if (!precios.some(p => p.id === item.id)) {
      setPrecios([...precios, { ...item, precio: '' }]);
    }
    setBusqueda('');
  };

  // Eliminar item de la tabla de precios
  const eliminarItem = (id) => {
    setPrecios(precios.filter(item => item.id !== id));
  };

  // Actualizar precio de un item
  const actualizarPrecio = (id, nuevoPrecio) => {
    setPrecios(precios.map(item =>
      item.id === id ? { ...item, precio: nuevoPrecio } : item
    ));
  };

  // Descargar precios en Excel
  const descargarExcel = () => {
    if (precios.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay precios',
        text: 'Agrega al menos un precio para descargar',
        confirmButtonColor: '#4fc3f7'
      });
      return;
    }

    const datos = precios.map(item => ({
      EAN: item.ean,
      Cantidad: item.precio,
      Descripción: item.Descripcion
    }));

    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(libro, hoja, 'Precios');
    XLSX.writeFile(libro, 'precios.xlsx');

    // Limpiar después de descargar
    localStorage.removeItem('precios');
    setPrecios([]);
  };

  return (
    <div className="container mt-3">
      {/* Campo de búsqueda */}
      <div className="row mb-4">
        <div className="col-md-6">
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Buscar por EAN o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </Form.Group>

          {/* Resultados de búsqueda */}
          {busqueda && (
            <div className="list-group mt-2">
              {resultados.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="list-group-item list-group-item-action"
                  onClick={() => agregarItem(item)}
                >
                  {item.ean} - {item.Descripcion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de precios */}
      <Table striped bordered hover responsive>
        <thead className="bg-success text-white">
          <tr>
            <th>EAN</th>
            <th>Cant.</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {precios.map(item => (
            <tr key={item.id}>
              <td>{item.ean}</td>
              <td>
                <Form.Control
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => actualizarPrecio(item.id, e.target.value)}
                  step="1"
                  min="1"
                />
              </td>
              <td>{item.Descripcion}</td>
              <td>
                <Button
                  variant="danger"
                  onClick={() => eliminarItem(item.id)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Botón para descargar Excel */}
      <div className="text-center mt-4">
        <Button
          variant="primary"
          onClick={descargarExcel}
          disabled={precios.length === 0}
        >
          Descargar Precios en Excel
        </Button>
      </div>
    </div>
  );
}

export default RealizarPrecios;