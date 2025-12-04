// routes/ventas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Registrar venta de producto
router.post('/producto', async (req, res) => {
  const { order_id, product_external_id, price, quantity, payment_status } = req.body;
  const store_id = 3; // fijo para tu cafetería

  if (!order_id || !product_external_id || !price || !quantity || !payment_status) {
    return res.status(400).json({ error: "Faltan parámetros en la petición" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO ventas (order_id, store_id, product_external_id, price, quantity, size, color, payment_status)
       VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6)
       RETURNING *`,
      [order_id, store_id, product_external_id, price, quantity, payment_status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al registrar venta:", error.message);
    res.status(500).json({ error: error.message });
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
