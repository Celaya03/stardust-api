// routes/ventas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

// 👉 Función para generar order_id consecutivo
async function generarOrderId() {
  const result = await pool.query(
    `SELECT order_id 
     FROM ventas 
     WHERE store_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [3]
  );

  let nuevoNumero = 1; // valor inicial

  if (result.rows.length > 0) {
    const ultimoOrderId = result.rows[0].order_id; // ej. "ORD005"
    const numero = parseInt(ultimoOrderId.replace("ORD", ""), 10);
    nuevoNumero = numero + 1;
  }

  // Formatear con ceros a la izquierda (ej. ORD001, ORD002, ORD010)
  return `ORD${String(nuevoNumero).padStart(3, "0")}`;
}

router.post('/venta-interna', async (req, res) => {
  const { product_external_id, price, quantity, cliente, producto } = req.body;

  try {
    // 1. Generar order_id automático
    const order_id = await generarOrderId();

    // 2. Insertar venta con payment_status = pendiente
    await pool.query(
      `INSERT INTO ventas (order_id, store_id, product_external_id, price, quantity, payment_status,total)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [order_id, 3, product_external_id, price, quantity, "pendiente"]
    );

    // 3. Reducir stock
    await pool.query(
      `UPDATE productos SET stock = stock - $1 WHERE id_producto = $2 AND store_id = $3`,
      [quantity, product_external_id, 3]
    );

    // 4. Preparar body para el servicio de envíos
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

    // 5. POST al servicio de envíos externo
    const respuestaEnvios = await axios.post(
      "https://gestion-envios-sz3x.onrender.com/ordenes",
      datosEnvio,
      { headers: { "Content-Type": "application/json" } }
    );

    const codigoSeguimiento = respuestaEnvios.data.codigo_seguimiento;

    // 6. Guardar estado inicial del envío
    await pool.query(
      `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,NOW())`,
      [order_id, codigoSeguimiento, "pendiente", "almacén"]
    );

    // 7. Responder al frontend
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

