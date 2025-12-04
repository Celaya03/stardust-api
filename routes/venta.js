// routes/ventas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.post('/ventas/producto', async (req, res) => {
  const { order_id, product_external_id, price, quantity, total, payment_status } = req.body;

  try {
    // 1. Registrar venta en tu BD
    await pool.query(
      `INSERT INTO ventas (id_orden, id_producto, precio_unitario, cantidad, total, estado_pago)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [order_id, product_external_id, price, quantity, total, payment_status]
    );

    // 2. Preparar body para el servicio de envíos
    const datosEnvio = {
      id_orden_externa: order_id,
      id_orden_original: `P-${order_id}`, // puedes usar tu propio formato
      servicio_origen: "Cafetería Stardust",
      webhook_url: "https://stardust-api-6e7j.onrender.com/api/envios/webhook-envios",
      datos_cliente: {
        nombre: "Pancho Bigoton", // aquí deberías usar los datos reales del cliente
        direccion: "Mendoza 34",
        telefono: "5556790",
        email: "Bigoton@ejemplo.com"
      },
      productos: [
        {
          sku: product_external_id,
          nombre: "Latte", // o el nombre real del producto
          cantidad: quantity,
          precio_unitario: price
        }
      ]
    };

    // 3. Hacer POST al servicio de envíos externo
    const respuestaEnvios = await axios.post(
      "https://gestion-envios-sz3x.onrender.com/ordenes", // 👈 aquí va la URL real
      datosEnvio,
      { headers: { "Content-Type": "application/json" } }
    );

    const codigoSeguimiento = respuestaEnvios.data.codigo_seguimiento;

    // 4. Guardar envío inicial en tu BD
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,NOW())`,
      [order_id, codigoSeguimiento, "pendiente", "almacén"]
    );

    // 5. Responder al frontend con venta + envío
    res.json({
      mensaje: "Venta y envío registrados correctamente",
      order_id,
      codigo_seguimiento: codigoSeguimiento
    });

  } catch (err) {
    console.error("❌ Error registrando venta/envío:", err.message);
    res.status(500).json({ error: "Error registrando venta/envío" });
  }
});


router.get('/ventas', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT order_id, store_id, product_external_id, price, quantity, payment_status, created_at
       FROM ventas
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al consultar ventas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
