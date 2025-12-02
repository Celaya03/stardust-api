import React, { useState, useEffect } from "react";
import { apiGet } from "../services/api";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await apiGet("/api/catalogo/");
        // Supone que data.productos existe
        setProductos(data.productos || []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar productos");
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
          {productos.map((prod) => {
            const precio = Number(prod.precio);
            return (
              <li key={prod.id_producto}>
                {prod.nombre} — $
                {isNaN(precio) ? prod.precio : precio.toFixed(2)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
