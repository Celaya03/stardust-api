import React, { useState, useEffect } from "react";
import { apiGet } from "../services/api";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await apiGet("/api/catalogo/");  // tu ruta
        // suponiendo que data tiene { store_id, productos: [...] }
        if (!data.productos) {
          throw new Error("Respuesta inválida del servidor");
        }
        setProductos(data.productos);
      } catch (err) {
        console.error("Error al obtener productos:", err);
        setError(err.message || "Error al cargar");
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  if (loading) return <p>Cargando productos…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Catálogo de productos</h2>
      {productos.length === 0 ? (
        <p>No hay productos disponibles.</p>
      ) : (
        <ul>
          {productos.map((prod) => (
            <li key={prod.id_producto}>
              {prod.nombre} — ${prod.precio.toFixed(2)} — Stock: {prod.stock}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
