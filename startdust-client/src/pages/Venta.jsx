import { useState } from "react";
import { apiPost } from "../services/api";

export default function Venta() {
  const [form, setForm] = useState({
    order_id: "",
    product_external_id: "",
    price: "",
    quantity: "",
    payment_status: "paid"
  });

  const [resp, setResp] = useState(null);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function registrarVenta() {
    const data = await apiPost("/venta/producto", {
      ...form,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
    });
    setResp(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Registrar Venta</h2>

      {Object.keys(form).map(k => (
        <input key={k} name={k} value={form[k]} placeholder={k} onChange={handle} />
      ))}

      <button onClick={registrarVenta}>Registrar</button>

      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
