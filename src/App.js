// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import ListaEatwellTable from "./components/ListaEatwellTable";
import VerPedidos from "./components/VerPedidos";
import EatWellLogo from "./img/EatWell.png"; // Asegúrate de tener la imagen en esta ruta
import "./App.css"; 



function App() {
  return (
    <Router>
      <div>
        {/* Encabezado con logo y menú */}
        <Navbar bg="light" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand as={Link} to="/">
            <div className="text-center my-5">
        <img
          src={EatWellLogo}
          alt="EatWell Logo"
          className="img-fluid"
          style={{ maxWidth: "200px" }}
        />
      </div>
            </Navbar.Brand>
           
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link as={Link} to="/" className="me-3">
                  <button className="btn btn-outline-primary">Generar Pedido</button>
                </Nav.Link>
                <Nav.Link as={Link} to="/ver-pedidos">
                  <button className="btn btn-outline-secondary">Ver Pedidos</button>
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Contenido principal */}
        <Container className="mt-4">
          <Routes>
            <Route path="/" element={<ListaEatwellTable />} />
            <Route path="/ver-pedidos" element={<VerPedidos />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;