const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión central a PostgreSQL

// Webhook de envíos
router.post('/webhook-envios', async (req, res) => {
  const { id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha } = req.body;

  console.log("📨 Notificación de envíos:", req.body);

  try {
    // Actualizar estado en pedido
    await pool.query(
      'UPDATE pedido SET estado_envio = $1 WHERE codigo_seguimiento = $2',
      [estado_actual, codigo_seguimiento]
    );

    // Guardar histórico en movimientos_envio
    await pool.query(
      `INSERT INTO movimientos_envio (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha]
    );

    res.json({ recibido: true });
  } catch (error) {
    console.error("Error al procesar webhook:", error);
    res.status(500).json({ error: "Error interno al procesar webhook" });
  }
});

module.exports = router;