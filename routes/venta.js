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
     // 1. Generar automáticamente el order_id con formato ORD-XXX
    const resultSeq = await pool.query("SELECT nextval('orden_seq') AS numero");
    const numero = resultSeq.rows[0].numero;
    const order_id = `ORD-${String(numero).padStart(3, '0')}`; // ej. ORD-001
    // 1. Insertar cada producto en ventas y actualizar stock
    for (const p of products) {
      const productId = p.product_external_id; // 👈 viene del body

      // Validar que exista en productos
      const result = await pool.query(
        `SELECT id_producto 
         FROM productos 
         WHERE id_producto = $1 AND store_id = $2`,
        [productId, 3]
      );

      if (result.rows.length === 0) {
        throw new Error(`Producto con id_producto ${productId} no encontrado`);
      }

      // Insertar en ventas
      await pool.query(
        `INSERT INTO ventas (order_id, store_id, product_external_id, price, quantity, size, color, payment_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          order_id,
          3,
          productId,
          price,
          p.quantity,
          p.size || null,
          p.color || null,
          payment_status
        ]
      );

      // Actualizar stock
      await pool.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id_producto = $2 AND store_id = $3`,
        [p.quantity, productId, 3]
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
        sku: p.product_external_id,   // 👈 usa el mismo campo
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
    console.error("❌ Error registrando venta/envío:", err);
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
