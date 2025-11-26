const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión central a PostgreSQL

router.post('/webhook-envios', async (req, res) => {
  const { id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha } = req.body;

  console.log("📨 Notificación de envíos:", JSON.stringify(req.body, null, 2));

  try {
    // Estado actual en edo_env usando id_orden_externa como clave única
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_orden_externa)
       DO UPDATE SET codigo_seguimiento = EXCLUDED.codigo_seguimiento,
                     estado_actual = EXCLUDED.estado_actual,
                     ubicacion_actual = EXCLUDED.ubicacion_actual,
                     fecha_actualizacion = EXCLUDED.fecha_actualizacion`,
      [id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha]
    );

    // Histórico en movimientos_envio
    await pool.query(
      `INSERT INTO movimientos_envio (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha)
       VALUES ($1, $2, $3, $4, $5)`,
      [id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha]
    );

    res.json({ recibido: true });
  } catch (error) {
    console.error("❌ Error al procesar webhook:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

