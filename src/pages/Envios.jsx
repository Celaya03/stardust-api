import React, { useState, useEffect } from "react";
import { apiGet } from "../services/api";

export default function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiGet("api/envios/procesar-pago");  // o la ruta correcta de tu backend
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
    <div className="table-container">
      <h2>Historial de Transacciones</h2>
      <div className="table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>ID Transacción</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Número Tarjeta</th>
              <th>Estado</th>
              <th>Firma</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((t) => (
              <tr key={t.idtransaccion}>
                <td>{new Date(t.creadautc).toLocaleString()}</td>
                <td>{t.idtransaccion}</td>
                <td>{t.tipotransaccion}</td>
                <td>{t.montotransaccion}</td>
                <td>{t.numerotarjeta}</td>
                <td>{t.nombreestado}</td>
                <td>{t.firma}</td>
                <td>{t.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

