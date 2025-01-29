// src/components/ListaEatwellTable.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import DownloadExcelButton from "./DownloadExcelButton";

function ListaEatwellTable() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cantidades, setCantidades] = useState({});

  // Cargar los registros de Firestore al montar el componente
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

  // Maneja el cambio en el campo de cantidad
  const handleCantidadChange = (id, value) => {
    const cantidad = parseInt(value, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      setCantidades({ ...cantidades, [id]: cantidad });
    }
  };

  // Guardar el pedido en Firestore
  const guardarPedido = async () => {
    // Filtra los registros que tienen una cantidad ingresada
    const pedido = registros
      .filter((registro) => cantidades[registro.id] > 0)
      .map((registro) => {
        // Verifica que todos los campos estén definidos
        if (!registro.ean || !registro.Descripcion || !cantidades[registro.id]) {
          console.error("Datos incompletos para el registro:", registro);
          return null; // Ignora este registro
        }
        return {
          ean: registro.ean,
          Descripcion: registro.Descripcion,
          Cantidad: cantidades[registro.id],
        };
      })
      .filter((item) => item !== null); // Filtra los registros nulos
  
    // Si no hay productos en el pedido, muestra un mensaje
    if (pedido.length === 0) {
      alert("No hay productos en el pedido.");
      return;
    }
  
    // Genera el nombre del documento con la fecha actual
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // Los meses van de 0 a 11
    const año = fecha.getFullYear();
    const nombreDocumento = `pedido${dia}-${mes}-${año}`;
  
    try {
      // Guarda el pedido como un documento en la colección "pedidos"
      await addDoc(collection(db, "pedidos"), {
        nombre: nombreDocumento,
        productos: pedido,
        fecha: new Date(),
      });
      alert("Pedido guardado correctamente en Firestore.");
    } catch (error) {
      console.error("Error al guardar el pedido:", error);
      alert("Hubo un error al guardar el pedido.");
    }
  };

  if (loading) {
    return <p>Cargando registros...</p>;
  }

  return (
    <div className="table-responsive">
    <table className="table table-bordered table-striped table-hover">
    <thead className="custom-thead">
      <tr>
        <th className="text-center">Ean</th>
        <th className="text-center">Descripción</th>
        <th className="text-center">UC</th>
        <th className="text-center">Cantidad</th>
      </tr>
    </thead>
    <tbody>
      {registros.map((registro) => (
        <tr key={registro.id} className="text-center">
          <td className="align-middle">{registro.ean}</td>
          <td className="align-middle">{registro.Descripcion}</td>
          <td className="align-middle">{registro.UC}</td>
          <td className="align-middle">
            <input
              type="number"
              min="1"
              style={{ width: '80px' }}
              value={cantidades[registro.id] || ""}
              onChange={(e) => handleCantidadChange(registro.id, e.target.value)}
              className="form-control form-control-sm mx-auto"
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
      <button onClick={guardarPedido} className="btn btn-primary">
        Guardar Pedido
      </button>
      <DownloadExcelButton registros={registros} cantidades={cantidades} />
    </div>
  );
}

export default ListaEatwellTable;