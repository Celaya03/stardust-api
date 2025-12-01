import React, { useState, useEffect } from "react";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await apiGet("/api/catalogo");
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        setProductos(data);
      } catch (err) {
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
      {productos.length === 0
        ? <p>No hay productos disponibles.</p>
        : (
          <ul>
            {productos.map(prod => (
              <li key={prod.id}>
                {prod.nombre} — ${prod.precio}
              </li>
            ))}
          </ul>
        )
      }
    </div>
  );
}

