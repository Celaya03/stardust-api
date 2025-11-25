const express = require('express');
const router = express.Router();
const pool = require('../db');

// Este endpoint lo llama el servicio externo
router.post('/webhook-envios', async (req, res) => {
  const {
    id_orden_externa,
    codigo_seguimiento,
    estado_actual,
    ubicacion_actual,
    fecha_actualizacion
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5)`,
      [id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion]
    );

    res.status(201).json({ message: 'Estado de envío guardado en edo_env' });
  } catch (err) {
    console.error('❌ Error al guardar en edo_env:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
