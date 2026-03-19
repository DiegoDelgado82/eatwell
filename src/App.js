// src/App.js
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ListaEatwellTable from './components/ListaEatwellTable';
import VerPedidos from './components/VerPedidos';
import RealizarPrecios from './components/RealizarPrecios';
import CargarLista from './components/ExcelUploader';
import CrudArticulos from './components/CrudArticulos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={<div className="text-center mt-4">Seleccione una opción</div>}
          />
          <Route path="generar-pedido" element={<ListaEatwellTable />} />
          <Route path="ver-pedidos" element={<VerPedidos />} />
          <Route path="realizar-precios" element={<RealizarPrecios />} />
          <Route path="cargar-lista" element={<CargarLista />} />
          <Route path="crud-articulos" element={<CrudArticulos />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;