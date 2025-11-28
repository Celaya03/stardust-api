// routes/catalogo.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

router.post('/obtener', async (req, res) => {
  const { store_id, category, api_url } = req.body;

  if (!store_id || !category || !api_url) {
    return res.status(400).json({ error: "Faltan parámetros en la petición" });
  }

  try {
    const result = await pool.query(
      'SELECT id_producto, nombre, precio, stock, categoria FROM productos WHERE store_id = $1 AND categoria = $2',
      [store_id, category]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No hay productos en esa categoría para esta tienda" });
    }

    // 👉 Respuesta con catálogo
    res.json({
      store_id,
      category,
      api_url, // lo devuelves si ellos lo quieren ver reflejado
      productos: result.rows
    });
  } catch (error) {
    console.error("❌ Error al obtener catálogo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


