// routes/disponibilidad.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión central a PostgreSQL

// Verificar disponibilidad de producto en tu tienda (store_id = 3)
router.post('/verificar', async (req, res) => {
  const { id_producto, cantidad_solicitada } = req.body;
  const store_id = 3; // tu tienda fija

  // 1. Validar cantidad positiva
  if (cantidad_solicitada <= 0) {
    return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
  }

  try {
    // 2. Buscar producto en disponibilidad
    const result = await pool.query(
      'SELECT stock FROM disponibilidad WHERE store_id = $1 AND id_producto = $2',
      [store_id, id_producto]
    );

    // 3. Si no existe el producto
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado en esta tienda" });
    }

    // 4. Devolver id_producto y stock
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
