// src/components/VerPedidos.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { FaDownload } from "react-icons/fa";

const sucursales = [
  "Carrefour Colón",
  "Carrefour Jardín",
  "Carrefour Recta",
  "Carrefour Villa",
  "Maxi Juan B Justo",
  "Maxi Cacheuta",
  "Carrefour Granaderos",
];

const crearProductoVacio = () => ({
  ean: "",
  Descripcion: "",
  Cantidad: "",
});

const crearFormVacio = () => {
  const hoy = new Date().toISOString().slice(0, 10);

  return {
    nombre: "",
    sucursal: "",
    fecha: hoy,
    productos: [crearProductoVacio()],
  };
};

const formatearFecha = (fecha) => {
  if (!fecha) return "";

  const fechaDate = fecha.toDate ? fecha.toDate() : new Date(fecha);
  if (Number.isNaN(fechaDate.getTime())) return "";

  return fechaDate.toLocaleDateString();
};

const fechaParaInput = (fecha) => {
  if (!fecha) return new Date().toISOString().slice(0, 10);

  const fechaDate = fecha.toDate ? fecha.toDate() : new Date(fecha);
  if (Number.isNaN(fechaDate.getTime())) return new Date().toISOString().slice(0, 10);

  return fechaDate.toISOString().slice(0, 10);
};

const generarNombrePedido = (fechaInput, sucursal) => {
  const fecha = new Date(`${fechaInput}T00:00:00`);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `pedido${dia}-${mes}-${anio} ${sucursal}`;
};

function VerPedidos() {
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState(crearFormVacio);

  const cargarPedidos = async (sucursal = sucursalSeleccionada) => {
    setLoading(true);

    try {
      const pedidosRef = collection(db, "pedidos");
      const q = sucursal
        ? query(pedidosRef, where("sucursal", "==", sucursal), orderBy("fecha", "desc"))
        : query(pedidosRef, orderBy("fecha", "desc"));

      const querySnapshot = await getDocs(q);
      const datos = querySnapshot.docs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          ...data,
          fechaOriginal: data.fecha,
          fecha: formatearFecha(data.fecha),
          productos: Array.isArray(data.productos) ? data.productos : [],
        };
      });

      setPedidos(datos);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message.includes("index")
          ? "Se requiere crear un índice en Firestore. Hacelo desde el enlace que muestra la consola."
          : "No se pudieron cargar los pedidos.",
        confirmButtonColor: "#4fc3f7",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const descargarPedidoExcel = (pedido) => {
    const datos = pedido.productos.map((producto) => ({
      EAN: producto.ean,
      Cantidad: producto.Cantidad,
      Descripcion: producto.Descripcion,
    }));

    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(libro, hoja, "Pedido");

    const fechaArchivo = pedido.fecha ? pedido.fecha.replace(/\//g, "-") : "sin-fecha";
    const nombreArchivo = `pedido_${fechaArchivo}_${pedido.sucursal}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
  };

  const resetForm = () => {
    setFormData(crearFormVacio());
    setEditandoId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductoChange = (index, campo, value) => {
    setFormData((prev) => {
      const productos = prev.productos.map((producto, productoIndex) =>
        productoIndex === index ? { ...producto, [campo]: value } : producto
      );

      return {
        ...prev,
        productos,
      };
    });
  };

  const agregarProducto = () => {
    setFormData((prev) => ({
      ...prev,
      productos: [...prev.productos, crearProductoVacio()],
    }));
  };

  const quitarProducto = (index) => {
    setFormData((prev) => ({
      ...prev,
      productos:
        prev.productos.length === 1
          ? [crearProductoVacio()]
          : prev.productos.filter((_, productoIndex) => productoIndex !== index),
    }));
  };

  const validarPedido = () => {
    if (!formData.sucursal) {
      Swal.fire("Atención", "Debes seleccionar una sucursal.", "warning");
      return false;
    }

    if (!formData.fecha) {
      Swal.fire("Atención", "Debes seleccionar una fecha.", "warning");
      return false;
    }

    const productosValidos = formData.productos.filter(
      (producto) =>
        String(producto.ean).trim() ||
        String(producto.Descripcion).trim() ||
        String(producto.Cantidad).trim()
    );

    if (!productosValidos.length) {
      Swal.fire("Atención", "El pedido debe tener al menos un producto.", "warning");
      return false;
    }

    const productoIncompleto = productosValidos.some(
      (producto) =>
        !String(producto.ean).trim() ||
        !String(producto.Descripcion).trim() ||
        Number(producto.Cantidad) <= 0
    );

    if (productoIncompleto) {
      Swal.fire(
        "Atención",
        "Cada producto debe tener EAN, descripción y una cantidad mayor a cero.",
        "warning"
      );
      return false;
    }

    return true;
  };

  const guardarPedido = async (e) => {
    e.preventDefault();

    if (!validarPedido()) return;

    try {
      setGuardando(true);

      const productos = formData.productos
        .filter(
          (producto) =>
            String(producto.ean).trim() ||
            String(producto.Descripcion).trim() ||
            String(producto.Cantidad).trim()
        )
        .map((producto) => ({
          ean: String(producto.ean).trim(),
          Descripcion: String(producto.Descripcion).trim(),
          Cantidad: Number(producto.Cantidad),
        }));

      const payload = {
        nombre: formData.nombre.trim() || generarNombrePedido(formData.fecha, formData.sucursal),
        sucursal: formData.sucursal,
        productos,
        fecha: new Date(`${formData.fecha}T00:00:00`),
      };

      if (editandoId) {
        await updateDoc(doc(db, "pedidos", editandoId), payload);
        Swal.fire("Actualizado", "El pedido fue actualizado correctamente.", "success");
      } else {
        await addDoc(collection(db, "pedidos"), payload);
        Swal.fire("Guardado", "El pedido fue creado correctamente.", "success");
      }

      resetForm();
      await cargarPedidos(sucursalSeleccionada);
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      Swal.fire("Error", "No se pudo guardar el pedido.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const editarPedido = (pedido) => {
    setEditandoId(pedido.id);
    setFormData({
      nombre: pedido.nombre || "",
      sucursal: pedido.sucursal || "",
      fecha: fechaParaInput(pedido.fechaOriginal),
      productos: pedido.productos.length ? pedido.productos : [crearProductoVacio()],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarPedido = async (pedido) => {
    const result = await Swal.fire({
      title: "Eliminar pedido?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "pedidos", pedido.id));
      Swal.fire("Eliminado", "El pedido fue eliminado.", "success");
      await cargarPedidos(sucursalSeleccionada);
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      Swal.fire("Error", "No se pudo eliminar el pedido.", "error");
    }
  };

  const cambiarSucursalFiltro = (e) => {
    const sucursal = e.target.value;
    setSucursalSeleccionada(sucursal);
    cargarPedidos(sucursal);
  };

  return (
    <div className="container py-4">
      <div className="card shadow-sm mb-4">
        <div className="card-header">
          {editandoId ? "Editar pedido" : "Nuevo pedido"}
        </div>
        <div className="card-body">
          <form onSubmit={guardarPedido}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Sucursal</label>
                <select
                  name="sucursal"
                  className="form-select"
                  value={formData.sucursal}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar sucursal</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal} value={sucursal}>
                      {sucursal}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  className="form-control"
                  value={formData.fecha}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-5">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  className="form-control"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Se genera automáticamente si queda vacío"
                />
              </div>
            </div>

            <div className="table-responsive mt-4">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>EAN</th>
                    <th>Descripción</th>
                    <th style={{ width: "130px" }}>Cantidad</th>
                    <th style={{ width: "120px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.productos.map((producto, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={producto.ean}
                          onChange={(e) => handleProductoChange(index, "ean", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={producto.Descripcion}
                          onChange={(e) =>
                            handleProductoChange(index, "Descripcion", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={producto.Cantidad}
                          onChange={(e) =>
                            handleProductoChange(index, "Cantidad", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => quitarProducto(index)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={agregarProducto}
              >
                Agregar producto
              </button>

              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId ? "Actualizar pedido" : "Guardar pedido"}
              </button>

              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header">Listado de pedidos</div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-5">
              <select
                className="form-select"
                value={sucursalSeleccionada}
                onChange={cambiarSucursalFiltro}
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal} value={sucursal}>
                    {sucursal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p>Cargando pedidos...</p>
          ) : pedidos.length === 0 ? (
            <p>No hay pedidos cargados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Sucursal</th>
                    <th>Nombre</th>
                    <th>Productos</th>
                    <th style={{ minWidth: "260px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>{pedido.fecha}</td>
                      <td>{pedido.sucursal}</td>
                      <td>{pedido.nombre}</td>
                      <td>{pedido.productos.length}</td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => descargarPedidoExcel(pedido)}
                            title="Descargar Excel"
                          >
                            <FaDownload className="download-icon" />
                          </button>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => editarPedido(pedido)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => eliminarPedido(pedido)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerPedidos;
