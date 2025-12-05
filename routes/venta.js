// routes/ventas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.post('/producto', async (req, res) => {
  const { order_id, payment_status, cliente, productos } = req.body;

  try {
    // Construir placeholders dinámicos para multi-row insert
    const values = [];
    const placeholders = productos.map((p, i) => {
      const baseIndex = i * 6;
      values.push(order_id, 3, p.product_external_id, p.price, p.quantity, payment_status);
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
    }).join(",");

    const query = `
      INSERT INTO ventas (order_id, store_id, product_external_id, price, quantity, payment_status)
      VALUES ${placeholders}
    `;

    await pool.query(query, values);

    // Reducir stock de cada producto
    for (const p of productos) {
      await pool.query(
        `UPDATE productos SET stock = stock - $1 WHERE id_producto = $2 AND store_id = $3`,
        [p.cantidad, p.product_external_id, 3]
      );
    }

    // Preparar body para el servicio de envíos
    const datosEnvio = {
      id_orden_externa: order_id,
      id_orden_original: `P-${order_id}`,
      servicio_origen: "Cafetería Stardust",
      webhook_url: "https://stardust-api-6e7j.onrender.com/api/envios/webhook-envios",
      datos_cliente: cliente,
      productos // 👈 se manda el arreglo completo
    };

    const respuestaEnvios = await axios.post(
      "https://gestion-envios-sz3x.onrender.com/ordenes",
      datosEnvio,
      { headers: { "Content-Type": "application/json" } }
    );

    const codigoSeguimiento = respuestaEnvios.data.codigo_seguimiento;

    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,NOW())`,
      [order_id, codigoSeguimiento, "pendiente", "almacén"]
    );

    res.json({
      mensaje: "Venta y envío registrados correctamente",
      order_id,
      codigo_seguimiento: codigoSeguimiento
    });

  } catch (err) {
    console.error("❌ Error registrando venta/envío:", err);
    res.status(500).json({ error: "Error registrando venta/envío" });
  }
});
module.exports = router;
