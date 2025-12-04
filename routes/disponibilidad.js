// routes/disponibilidad.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

router.post('/verificar', async (req, res) => {
  const { id_producto, cantidad_solicitada } = req.body;

  if (!id_producto || !cantidad_solicitada) {
    return res.status(400).json({ error: "Faltan parámetros en la petición" });
  }

  try {
    const result = await pool.query(
      'SELECT stock, precio, nombre FROM productos WHERE store_id = $1 AND id_producto = $2',
      [3, id_producto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ disponible: false, error: "Producto no encontrado en esta tienda" });
    }

    const producto = result.rows[0];
    const disponible = producto.stock >= cantidad_solicitada;

    res.json({
      id_producto,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      cantidad_solicitada,
      disponible
    });
  } catch (error) {
    console.error("❌ Error al verificar disponibilidad:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


