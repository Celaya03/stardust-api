const express = require('express');
const router = express.Router();
const pool = require('../db');

// Webhook que recibe el body del servicio externo
router.post('/webhook-envios', async (req, res) => {
  console.log('📦 Body recibido en webhook-envios:', req.body);

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

    res.status(201).json({
      message: 'Estado de envío guardado en edo_env',
      datos_guardados: {
        id_orden_externa,
        codigo_seguimiento,
        estado_actual,
        ubicacion_actual,
        fecha_actualizacion
      }
    });
  } catch (err) {
    console.error('❌ Error al guardar en edo_env:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

