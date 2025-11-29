import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    apiGet("/catalogo")
      .then(setProductos)
      .catch(() => alert("Error cargando catálogo"));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Catálogo de Productos</h2>
      <ul>
        {productos.map(p => (
          <li key={p.id_producto}>
            {p.nombre} — ${p.precio} — Stock: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );
}
