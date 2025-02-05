// src/components/MainLayout.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import EatWellLogo from '../img/EatWell.png';
import "../principal.css"

function MainLayout() {
  return (
    <div className="container-fluid">
      {/* Encabezado fijo */}
      <header className="fixed-top shadow-sm encabezado" style={{ zIndex: 1030 }}>
        <div className="container">
          <div className="text-center py-2">
            <img 
              src={EatWellLogo} 
              alt="EatWell Logo" 
              style={{ width: '140px' }}
            />
          </div>
          
          <div className="d-flex justify-content-center gap-2 pb-2">
            <Link to="/generar-pedido" className="btn btn-primary btn-sm px-3">
              Generar<br/> Pedido
            </Link>
            <Link to="/ver-pedidos" className="btn btn-secondary btn-sm px-3">
              Ver <br/>Pedidos
            </Link>
            <Link to="/realizar-precios" className="btn btn-success btn-sm px-3">
              Realizar<br/> Precios
            </Link>
           {/*  <Link to="/cargar-lista" className="btn btn-success btn-sm px-3">
              Cargar<br/> Lista
            </Link>*/}
          </div>
        </div>
      </header>

      {/* Contenido principal con espacio adaptativo */}
      <main className="container-fluid mt-5 pt-3">
        <div className="container" style={{ paddingTop: '80px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;