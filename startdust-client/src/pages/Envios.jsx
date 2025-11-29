import { useState } from "react";
import { apiPost } from "../services/api";

export default function Envios() {
  const [data, setData] = useState({});
  const [resp, setResp] = useState(null);

  const handle = e => setData({ ...data, [e.target.name]: e.target.value });

  async function enviarWebhook() {
    setResp(await apiPost("/envios/webhook-envios", data));
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Simular Webhook de Envíos</h2>

      <input name="id_orden_externa" onChange={handle} placeholder="ID Orden Externa" />
      <input name="codigo_seguimiento" onChange={handle} placeholder="Tracking" />
      <input name="estado_actual" onChange={handle} placeholder="Estado" />
      <input name="ubicacion_actual" onChange={handle} placeholder="Ubicación" />

      <button onClick={enviarWebhook}>Enviar</button>

      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
