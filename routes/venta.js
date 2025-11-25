const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { order_id, store_id, product_external_id, price, quantity, size, color, created_at, payment_status } = req.body;
  try {
    await pool.query(
      `INSERT INTO reg_vta_prod (order_id, store_id, product_external_id, price, quantity, size, color, created_at, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [order_id, store_id, product_external_id, price, quantity, size, color, created_at, payment_status]
    );
    res.status(201).json({ message: 'Venta registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM reg_vta_prod`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
