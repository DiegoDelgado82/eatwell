// src/App.js
import React, { useState } from "react";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
import ListaEatwellTable from "./components/ListaEatwellTable"; // Importa el componente
import EatWellLogo from "./img/EatWell.png"; // Asegúrate de tener la imagen en la carpeta src

function App() {
  const [mostrarLista, setMostrarLista] = useState(false); // Estado para alternar vistas

  // Función para manejar el clic en "Generar pedido"
  const handleGenerarPedido = () => {
    setMostrarLista(true);
  };

  // Función para volver a la vista principal
  const handleVolver = () => {
    setMostrarLista(false);
  };

  return (
    <div>
      {/* Encabezado con logo y botones */}
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#">
            <img
              src={EatWellLogo}
              width="120"
              height="auto"
              className="d-inline-block align-top"
              alt="EatWell Logo"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {!mostrarLista && (
                
                <Button variant="outline-primary" className="me-2" onClick={handleGenerarPedido}>
                  Generar pedido
                </Button>
                

                
              )}
              {mostrarLista && (
                <Button variant="outline-secondary" onClick={handleVolver}>
                  Volver
                </Button>
                
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Contenido dinámico */}
      <Container>
        {!mostrarLista ? (
          <>
            <h1>Bienvenido a EatWell</h1>
            <p>Selecciona una opción del menú para comenzar.</p>
          </>
        ) : (
          <ListaEatwellTable />
        )}
      </Container>
    </div>
  );
}

export default App;
