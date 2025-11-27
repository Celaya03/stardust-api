// routes/catalogo.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Devuelve el catálogo completo de la cafetería (store_id = 3)
router.get('/', async (req, res) => {
  const store_id = 3; // fijo para tu tienda

  try {
    const result = await pool.query(
      `SELECT id_producto, descripcion, precio, stock
       FROM catalogo
       WHERE store_id = $1`,
      [store_id]
    );

    // Agregar campos nulos para compatibilidad
    const catalogo = result.rows.map(producto => ({
      ...producto,
      talla: null,
      color: null,
      duracion_minutos: null
    }));

    res.json(catalogo);
  } catch (error) {
    console.error("❌ Error al consultar catálogo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


