import { useState } from "react";
import { apiPost } from "../services/api";

export default function Disponibilidad() {
  const [id, setId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [resp, setResp] = useState(null);

  async function verificar() {
    const data = await apiPost("/disponibilidad/verificar", {
      id_producto: parseInt(id),
      cantidad_solicitada: parseInt(cantidad),
    });
    setResp(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Verificar Disponibilidad</h2>

      <input placeholder="ID Producto" value={id} onChange={e => setId(e.target.value)} />
      <input placeholder="Cantidad" value={cantidad} onChange={e => setCantidad(e.target.value)} />
      <button onClick={verificar}>Verificar</button>

      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
