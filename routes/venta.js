// routes/ventas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.post('/venta-interna', async (req, res) => {
  const { order_id, product_external_id, price, quantity, cliente, producto } = req.body;

  try {
    // 1. Insertar venta con el order_id recibido y payment_status = pendiente
    await pool.query(
      `INSERT INTO ventas (order_id, store_id, product_external_id, price, quantity, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [order_id, 3, product_external_id, price, quantity, "pendiente"]
    );

    // 2. Reducir stock
    await pool.query(
      `UPDATE productos SET stock = stock - $1 WHERE id_producto = $2 AND store_id = $3`,
      [quantity, product_external_id, 3]
    );

    // 3. Preparar body para el servicio de envíos
    const datosEnvio = {
      id_orden_externa: order_id,
      id_orden_original: `P-${order_id}`,
      servicio_origen: "Cafetería Stardust",
      webhook_url: "https://stardust-api-6e7j.onrender.com/api/envios/webhook-envios",
      datos_cliente: {
        nombre: cliente.nombre,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        email: cliente.email
      },
      productos: [
        {
          sku: producto.sku,
          nombre: producto.nombre,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio_unitario
        }
      ]
    };

    // 4. POST al servicio de envíos externo
    const respuestaEnvios = await axios.post(
      "https://gestion-envios-sz3x.onrender.com/ordenes",
      datosEnvio,
      { headers: { "Content-Type": "application/json" } }
    );

    const codigoSeguimiento = respuestaEnvios.data.codigo_seguimiento;

    // 5. Guardar estado inicial del envío
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,NOW())`,
      [order_id, codigoSeguimiento, "pendiente", "almacén"]
    );

    // 6. Responder al frontend
    res.json({
      mensaje: "Venta interna registrada correctamente",
      order_id,
      codigo_seguimiento: codigoSeguimiento
    });

  } catch (err) {
    console.error("❌ Error registrando venta/envío:", err.message);
    res.status(500).json({ error: "Error registrando venta/envío" });
  }
});

module.exports = router;
