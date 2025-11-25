const express = require('express');
const router = express.Router();
const pool = require('../db');

// Webhook de envíos (ya lo tienes)
router.post('/webhook-envios', async (req, res) => {
  const { id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha } = req.body;
  try {
    await pool.query(
      'INSERT INTO movimientos_envio (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha) VALUES ($1, $2, $3, $4, $5)',
      [id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha]
    );
    await pool.query(
      'UPDATE pedido SET estado_envio = $1 WHERE id_pedido = $2',
      [estado_actual, id_orden_externa]
    );
    res.json({ recibido: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar movimientos
router.get('/movimientos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movimientos_envio ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



