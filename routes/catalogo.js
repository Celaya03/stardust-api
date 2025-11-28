// routes/catalogo.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

router.post('/', async (req, res) => {
  const { store_id, api_url } = req.body;

  if (!store_id || !api_url) {
    return res.status(400).json({ error: "Faltan parámetros en la petición" });
  }

  try {
    const result = await pool.query(
      'SELECT id_producto, nombre, precio, stock FROM productos WHERE store_id = $1',
      [store_id]
    );

    

    // 👉 Respuesta con catálogo
    res.json({
      store_id,
      productos: result.rows
    });
  } catch (error) {
    console.error("❌ Error al obtener catálogo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


