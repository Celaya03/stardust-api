const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { store_id, nombre, descripcion, precio, talla, color, stock, duracion_minutos } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO catalogo (store_id, nombre, descripcion, precio, talla, color, stock, duracion_minutos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [store_id, nombre, descripcion, precio, talla, color, stock, duracion_minutos]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM catalogo`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

