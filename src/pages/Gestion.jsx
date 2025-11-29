import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function Gestion() {
  const [catalogo, setCatalogo] = useState([]);

  useEffect(() => {
    apiGet("/gestion/catalogo").then(setCatalogo);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel de Gestión</h2>

      <h3>Productos Registrados</h3>
      <pre>{JSON.stringify(catalogo, null, 2)}</pre>
    </div>
  );
}
