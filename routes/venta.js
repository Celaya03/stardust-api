// routes/ventas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.post('/producto', async (req, res) => {
  const {
    order_id,
    price,
    products,       
    datos_cliente,
    payment_status
  } = req.body;

  try {
    // 1. Insertar cada producto en ventas y actualizar stock
    for (const p of products) {
  // 1. Buscar el id_producto real a partir del external_id
  const result = await pool.query(
    `SELECT id_producto 
     FROM productos 
     WHERE id_producto = $1 AND store_id = $2`,
    [p.external_id, 3]
  );

  if (result.rows.length === 0) {
    throw new Error(`Producto con external_id ${p.external_id} no encontrado`);
  }

  const idProducto = result.rows[0].id_producto;

  // 2. Insertar en ventas
  await pool.query(
    `INSERT INTO ventas (order_id, store_id, product_external_id, price, quantity, size, color, payment_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      order_id,
      3,
      idProducto,        // 👈 ahora siempre válido
      price,
      p.quantity,
      p.size || null,
      p.color || null,
      payment_status
    ]
  );

  // 3. Actualizar stock
  await pool.query(
    `UPDATE productos
     SET stock = stock - $1
     WHERE id_producto = $2 AND store_id = $3`,
    [p.quantity, idProducto, 3]
  );
}

    // 2. Preparar body para el servicio de envíos con todos los productos
    const datosEnvio = {
      id_orden_externa: order_id,
      id_orden_original: `P-${order_id}`,
      servicio_origen: "Cafetería Stardust",
      webhook_url: "https://stardust-api-6e7j.onrender.com/api/envios/webhook-envios",
      datos_cliente: {
        nombre: datos_cliente.nombre,
        direccion: datos_cliente.direccion,
        telefono: datos_cliente.telefono,
        email: datos_cliente.email
      },
      productos: products.map(p => ({
        sku: p.external_id,            // o tu campo real de SKU
        nombre: p.nombre || "Producto",
        cantidad: p.quantity,
        precio_unitario: p.precio_unitario || price
      }))
    };

    // 3. POST al servicio de envíos externo
    const respuestaEnvios = await axios.post(
      "https://gestion-envios-sz3x.onrender.com/ordenes",
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

    // 5. Responder al frontend
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

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT order_id, store_id, product_external_id, price, quantity, size, color, payment_status, created_at,total
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
