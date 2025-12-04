const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión a PostgreSQL

// 👉 GET sin body, responde con todo el catálogo de la tienda 3
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_producto, nombre, precio, stock FROM productos WHERE store_id = $1',
      [3] // 👈 store_id fijo para tu tienda
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No hay productos en esta tienda" });
    }
    const productosConCamposNulos = result.rows.map((producto) => ({
  ...producto,
  talla: null,
  color: null,
  duracion_minutos: null
}));

res.json({
  store_id: 3,
  productos: productosConCamposNulos
});

  } catch (error) {
    console.error("❌ Error al obtener catálogo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



