import React from 'react';
import ReactDOM from 'react-dom/client'; // Asegúrate de importar desde 'react-dom/client'
import App from './App';
import "./index.css"; 
const root = ReactDOM.createRoot(document.getElementById('root')); // Crea la raíz
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
