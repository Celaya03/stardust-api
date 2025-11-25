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

router.get('/catalogo/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      `
      SELECT id_catalogo, nombre, descripcion, precio, stock
      FROM catalogo_productos
      WHERE id_catalogo = $1;
      `,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
