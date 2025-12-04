const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión central a PostgreSQL

// Webhook de envíos
router.post('/webhook-envios', async (req, res) => {
  const { id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion } = req.body;

  console.log("📨 Notificación de envíos:", JSON.stringify(req.body, null, 2));

  try {
    // Reflejar estado actual en edo_env
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_orden_externa)
       DO UPDATE SET codigo_seguimiento = EXCLUDED.codigo_seguimiento,
                     estado_actual = EXCLUDED.estado_actual,
                     ubicacion_actual = EXCLUDED.ubicacion_actual,
                     fecha_actualizacion = EXCLUDED.fecha_actualizacion`,
      [id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion]
    );

    res.json({ recibido: true });
  } catch (error) {
    console.error("❌ Error al procesar webhook:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Consultar envío por código de seguimiento
router.get('/envios/:codigo', async (req, res) => {
  const { codigo } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion
       FROM edo_env
       WHERE codigo_seguimiento = $1
       ORDER BY fecha_actualizacion DESC
       LIMIT 1`,
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el envío' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error al consultar envío:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Consultar todos los envíos (último estado por cada código)
router.get('/envios', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (codigo_seguimiento)
              id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion
       FROM edo_env
       ORDER BY codigo_seguimiento, fecha_actualizacion DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al listar envíos:", error.message);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;



