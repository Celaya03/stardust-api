const express = require('express');
const router = express.Router();
const pool = require('../db'); // ✅ solo importas pool

// Insertar envío
router.post('/', async (req, res) => {
  const { id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion } = req.body;
  try {
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,$5)`,
      [id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion]
    );
    res.status(201).json({ message: 'Estado de envío guardado' });
  } catch (err) {
    console.error('❌ Error en POST /api/envios:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Consultar envíos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM edo_env`);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error en GET /api/envios:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



