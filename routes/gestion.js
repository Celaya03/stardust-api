const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = require('../db');

/* ============================
   CATALOGO DE PRODUCTOS
   ============================ */
router.get('/catalogo', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id_catalogo, nombre, descripcion, precio, stock
      FROM catalogo_productos
      ORDER BY id_catalogo;
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
