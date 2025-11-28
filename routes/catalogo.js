// routes/catalogo.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

router.post('/', async (req, res) => {
  const { api_url } = req.body;

  if (!api_url) {
    return res.status(400).json({ error: "Faltan parámetros en la petición" });
  }

  try {
    const result = await pool.query(
      'SELECT id_producto, nombre, precio, stock FROM productos',
      [store_id]
    );

    

    // 👉 Respuesta con catálogo
    res.json({
      productos: result.rows
    });
  } catch (error) {
    console.error("❌ Error al obtener catálogo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


