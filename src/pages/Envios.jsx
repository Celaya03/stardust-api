import React, { useState, useEffect } from "react";
import { apiGet } from "../services/api"; // tu helper para fetch/axios

export default function Envios() {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiGet("/procesar-pago");
        setTransacciones(data);
      } catch (err) {
        console.error("Error al obtener transacciones:", err);
        setError("Error cargando transacciones");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Cargando transacciones…</p>;
  if (error) return <p>{error}</p>;

  if (!transacciones || transacciones.length === 0) {
    return <p>No se encontraron transacciones.</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Historial de Transacciones</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID Transacción</th>
            <th>Monto</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {transacciones.map((t) => (
            <tr key={t.idtransaccion}>
              <td>{t.idtransaccion}</td>
              <td>{t.montotransaccion}</td>
              <td>{t.tipotransaccion}</td>
              <td>{t.nombreestado}</td>
              <td>{new Date(t.creadautc).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

