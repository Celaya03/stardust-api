// routes/catalogo.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Obtener catálogo por store_id y categoría
router.post('/obtener', async (req, res) => {
  const { store_id, category } = req.body;

  if (!store_id || !category) {
    return res.status(400).json({ error: "Faltan parámetros en la petición" });
  }

  try {
    const result = await pool.query(
      'SELECT id_producto, nombre, precio, stock, categoria FROM productos WHERE store_id = $1 AND categoria = $2',
      [store_id, category]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No hay productos en esta categoría para la tienda" });
    }

    res.json({
      store_id,
      category,
      productos: result.rows
    });
  } catch (error) {
    console.error("❌ Error al obtener catálogo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

