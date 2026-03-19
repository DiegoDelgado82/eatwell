import React, { useEffect, useState,useCallback  } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

const CrudArticulos = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [formData, setFormData] = useState({
    Descripcion: "",
    UC: "",
    ean: "",
  });

 

  useEffect(() => {
  const obtenerArticulos = async () => {
    try {
      setLoading(true);

      const articulosRef = collection(db, "ListaEatwell");
      const q = query(articulosRef, orderBy("pos", "asc"));
      const snapshot = await getDocs(q);

      const lista = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setArticulos(lista);
    } catch (error) {
      console.error("Error al obtener artículos:", error);
      Swal.fire("Error", "No se pudieron cargar los artículos.", "error");
    } finally {
      setLoading(false);
    }
  };

  obtenerArticulos();
}, []);

 const obtenerArticulos = useCallback(async () => {
  try {
    setLoading(true);

    const articulosRef = collection(db, "ListaEatweel"); // 👈 ahora está adentro
    const q = query(articulosRef, orderBy("pos", "asc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setArticulos(lista);
  } catch (error) {
    console.error("Error al obtener artículos:", error);
    Swal.fire("Error", "No se pudieron cargar los artículos.", "error");
  } finally {
    setLoading(false);
  }
}, []);

  const obtenerUltimaPosicion = () => {
    if (!articulos.length) return 0;
    return Math.max(...articulos.map((a) => Number(a.pos) || 0));
  };

  const resetForm = () => {
    setFormData({
      Descripcion: "",
      UC: "",
      ean: "",
    });
    setEditandoId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarFormulario = () => {
    if (!formData.Descripcion.trim()) {
      Swal.fire("Atención", "La descripción es obligatoria.", "warning");
      return false;
    }

    if (formData.UC === "" || isNaN(Number(formData.UC))) {
      Swal.fire("Atención", "La UC debe ser numérica.", "warning");
      return false;
    }

    if (formData.ean === "" || isNaN(Number(formData.ean))) {
      Swal.fire("Atención", "El EAN debe ser numérico.", "warning");
      return false;
    }

    return true;
  };

  const guardarArticulo = async (e) => {
  e.preventDefault();

  if (!validarFormulario()) return;

  try {
    setGuardando(true);

    const payload = {
      Descripcion: formData.Descripcion.trim(),
      UC: Number(formData.UC),
      ean: Number(formData.ean),
    };

    if (editandoId) {
      const articuloDoc = doc(db, "ListaEatwell", editandoId);
      await updateDoc(articuloDoc, payload);

      Swal.fire("Actualizado", "El artículo fue actualizado.", "success");
    } else {
      const nuevaPos = obtenerUltimaPosicion() + 1;
      const articulosRef = collection(db, "ListaEatwell");

      await addDoc(articulosRef, {
        ...payload,
        pos: nuevaPos,
      });

      Swal.fire("Guardado", "El artículo fue creado correctamente.", "success");
    }

    resetForm();
    await obtenerArticulos();
  } catch (error) {
    console.error("Error al guardar artículo:", error);
    Swal.fire("Error", "No se pudo guardar el artículo.", "error");
  } finally {
    setGuardando(false);
  }
};

  const editarArticulo = (articulo) => {
    setFormData({
      Descripcion: articulo.Descripcion || "",
      UC: articulo.UC ?? "",
      ean: articulo.ean ?? "",
    });
    setEditandoId(articulo.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarArticulo = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar artículo?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "ListaEatwell", id));
      Swal.fire("Eliminado", "El artículo fue eliminado.", "success");
      obtenerArticulos();
    } catch (error) {
      console.error("Error al eliminar artículo:", error);
      Swal.fire("Error", "No se pudo eliminar el artículo.", "error");
    }
  };

  const normalizarFilaExcel = (fila) => {
    const filaNormalizada = {};
    Object.keys(fila).forEach((key) => {
      filaNormalizada[key.trim().toLowerCase()] = fila[key];
    });
    return filaNormalizada;
  };

  const cargarExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setGuardando(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!jsonData.length) {
        Swal.fire("Atención", "El archivo Excel está vacío.", "warning");
        return;
      }

      let ultimaPos = obtenerUltimaPosicion();
      const batch = writeBatch(db);
      let cantidadValidos = 0;

      for (const fila of jsonData) {
        const item = normalizarFilaExcel(fila);

        const ean = item.ean;
        const descripcion = item.descripcion;
        const uc = item.uc;

        if (
          descripcion === "" ||
          descripcion === undefined ||
          ean === "" ||
          ean === undefined ||
          uc === "" ||
          uc === undefined
        ) {
          continue;
        }

        ultimaPos += 1;

        const nuevoDocRef = doc(collection(db, "ListaEatwell"));
        batch.set(nuevoDocRef, {
          Descripcion: String(descripcion).trim(),
          ean: Number(ean),
          UC: Number(uc),
          pos: ultimaPos,
        });

        cantidadValidos += 1;
      }

      if (cantidadValidos === 0) {
        Swal.fire(
          "Atención",
          "No se encontraron filas válidas. El Excel debe tener columnas: ean, Descripcion y UC.",
          "warning"
        );
        return;
      }

      await batch.commit();

      Swal.fire(
        "Carga exitosa",
        `Se importaron ${cantidadValidos} artículos correctamente.`,
        "success"
      );

      obtenerArticulos();
    } catch (error) {
      console.error("Error al cargar Excel:", error);
      Swal.fire("Error", "No se pudo procesar el archivo Excel.", "error");
    } finally {
      setGuardando(false);
      e.target.value = "";
    }
  };

  return (
    <div className="container py-4">
      

      <div className="card shadow-sm mb-4">
        <div className="card-header">
          {editandoId ? "Editar artículo" : "Nuevo artículo"}
        </div>
        <div className="card-body">
          <form onSubmit={guardarArticulo}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">EAN</label>
                <input
                  type="number"
                  name="ean"
                  className="form-control"
                  value={formData.ean}
                  onChange={handleChange}
                  placeholder="Ingrese EAN"
                />
              </div>
              
              <div className="col-md-5">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  name="Descripcion"
                  className="form-control"
                  value={formData.Descripcion}
                  onChange={handleChange}
                  placeholder="Ingrese la descripción"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">UC</label>
                <input
                  type="number"
                  name="UC"
                  className="form-control"
                  value={formData.UC}
                  onChange={handleChange}
                  placeholder="Ingrese UC"
                />
              </div>

              
            </div>

            <div className="mt-4 d-flex gap-2 flex-wrap">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "Actualizar"
                  : "Guardar"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header">Carga masiva desde Excel</div>
        <div className="card-body">
          <p className="mb-2">
            El archivo debe tener columnas con estos nombres:
            <strong> ean, Descripcion, UC</strong>
          </p>
          <input
            type="file"
            accept=".xlsx, .xls"
            className="form-control"
            onChange={cargarExcel}
            disabled={guardando}
          />
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header">Listado de artículos</div>
        <div className="card-body">
          {loading ? (
            <p>Cargando artículos...</p>
          ) : articulos.length === 0 ? (
            <p>No hay artículos cargados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>POS</th>
                    <th>EAN</th>
                    <th>Descripción</th>
                    <th>UC</th>
                    <th style={{ minWidth: "180px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {articulos.map((articulo) => (
                    <tr key={articulo.id}>
                      <td>{articulo.pos}</td>
                      <td>{articulo.ean}</td>
                      <td>{articulo.Descripcion}</td>
                      <td>{articulo.UC}</td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => editarArticulo(articulo)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => eliminarArticulo(articulo.id)}
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
};

export default CrudArticulos;