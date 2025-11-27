// routes/disponibilidad.js
// routes/disponibilidad.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// Verificar disponibilidad con POST (recibe parámetros en body)
router.post('/verificar', async (req, res) => {
  const { store_id, id_producto, cantidad_solicitada } = req.body;

  if (!store_id || !id_producto || !cantidad_solicitada) {
    return res.status(400).json({ error: "Faltan parámetros en la petición" });
  }

  try {
    const result = await pool.query(
      'SELECT stock FROM disponibilidad WHERE store_id = $1 AND id_producto = $2',
      [store_id, id_producto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado en esta tienda" });
    }

    // 👉 Solo devolvemos el stock, sin lógica de disponibilidad
    res.json({
      store_id,
      id_producto,
      stock: result.rows[0].stock
    });
  } catch (error) {
    console.error("❌ Error al verificar disponibilidad:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
