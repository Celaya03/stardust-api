const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { id_producto, stock } = req.body;
  try {
    await pool.query(
      `INSERT INTO disp (id_producto, stock)
       VALUES ($1,$2)
       ON CONFLICT (id_producto) DO UPDATE SET stock = EXCLUDED.stock`,
      [id_producto, stock]
    );
    res.status(201).json({ message: 'Stock actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM disp`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
