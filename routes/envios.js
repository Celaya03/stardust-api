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

module.exports = router;




