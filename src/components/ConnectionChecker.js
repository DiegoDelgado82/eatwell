// src/components/ConnectionChecker.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Importa la configuración de Firebase
import { doc, getDoc } from "firebase/firestore";

function ConnectionChecker() {
  const [connectionStatus, setConnectionStatus] = useState("Verificando conexión...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Intenta leer un documento de Firestore (puedes usar una colección y documento de prueba)
        const docRef = doc(db, "testConnection", "testDoc");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setConnectionStatus("✅ Conexión a Firestore exitosa.");
        } else {
          setConnectionStatus("⚠️ La conexión funciona, pero el documento no existe.");
        }
      } catch (error) {
        setConnectionStatus("❌ Error de conexión a Firestore: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <div>
      <h2>Verificación de conexión a Firestore</h2>
      {isLoading ? <p>Cargando...</p> : <p>{connectionStatus}</p>}
    </div>
  );
}

export default ConnectionChecker;