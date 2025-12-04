// routes/ventas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/ventas/producto', async (req, res) => {
  const { order_id, product_external_id, price, quantity, total, payment_status } = req.body;

  try {
    // 1. Registrar venta
    await pool.query(
      `INSERT INTO ventas (id_orden, id_producto, precio_unitario, cantidad, total, estado_pago)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [order_id, product_external_id, price, quantity, total, payment_status]
    );

    // 2. Generar código de seguimiento (o pedirlo al servicio de envíos externo)
    const codigoSeguimiento = `TRACK-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    // 3. Registrar envío inicial en tu tabla edo_env
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,NOW())`,
      [order_id, codigoSeguimiento, "pendiente", "almacén"]
    );

    // 4. Responder al frontend con venta + envío
    res.json({
      mensaje: "Venta y envío registrados correctamente",
      order_id,
      codigo_seguimiento: codigoSeguimiento
    });

  } catch (err) {
    console.error("❌ Error registrando venta/envío:", err.message);
    res.status(500).json({ error: "Error registrando venta/envío" });
  }
});

router.get('/ventas', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT order_id, store_id, product_external_id, price, quantity, payment_status, created_at
       FROM ventas
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al consultar ventas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
