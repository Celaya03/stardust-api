const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.post('/producto', async (req, res) => {
  const {
    order_id: externalOrderId, // puede venir del mall
    price,
    products,
    payment_status
  } = req.body;

  try {
    let order_id;

    if (externalOrderId) {
      // Caso 2: venta externa → conservar el ID que viene
      order_id = externalOrderId;
    } else {
      // Caso 1: compra interna → generar automáticamente
      const resultSeq = await pool.query("SELECT nextval('orden_seq') AS numero");
      const numero = resultSeq.rows[0].numero;
      order_id = `ORD-${String(numero).padStart(3, '0')}`;
    }

    // Validar y actualizar stock de cada producto
    for (const p of products) {
      const result = await pool.query(
        `SELECT id_producto 
         FROM productos 
         WHERE id_producto = $1 AND store_id = $2`,
        [p.product_external_id, 3]
      );

      if (result.rows.length === 0) {
        throw new Error(`Producto con id_producto ${p.product_external_id} no encontrado`);
      }

      await pool.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id_producto = $2 AND store_id = $3`,
        [p.quantity, p.product_external_id, 3]
      );
    }

    // Insertar la venta como UNA sola fila con lista de productos
    await pool.query(
      `INSERT INTO ventas (order_id, store_id, price, productos, payment_status)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        order_id,
        3,
        price,
        JSON.stringify(products), // lista completa
        payment_status
      ]
    );

    // Preparar body para el servicio de envíos
    const datosEnvio = {
      id_orden_externa: order_id,
      id_orden_original: `P-${order_id}`,
      servicio_origen: "Cafetería Stardust",
      webhook_url: "https://stardust-api-6e7j.onrender.com/api/envios/webhook-envios",
      productos: products.map(p => ({
        sku: p.product_external_id,
        nombre: p.nombre || "Producto",
        cantidad: p.quantity,
        precio_unitario: p.precio_unitario || price
      }))
    };

    // POST al servicio de envíos externo
    const respuestaEnvios = await axios.post(
      "https://gestion-envios-sz3x.onrender.com/ordenes",
      datosEnvio,
      { headers: { "Content-Type": "application/json" } }
    );

    const codigoSeguimiento = respuestaEnvios.data.codigo_seguimiento;

    // Guardar envío inicial en tu BD
    await pool.query(
      `INSERT INTO edo_env (order_id, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (order_id) DO UPDATE
         SET codigo_seguimiento = EXCLUDED.codigo_seguimiento,
             estado_actual = EXCLUDED.estado_actual,
             ubicacion_actual = EXCLUDED.ubicacion_actual,
             fecha_actualizacion = EXCLUDED.fecha_actualizacion`,
      [order_id, codigoSeguimiento, "pendiente", "almacén"]
    );

    // Responder al frontend
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
      `SELECT order_id, store_id, price, productos, payment_status, created_at
       FROM ventas
       ORDER BY created_at DESC`
    );

    // Parsear productos JSON para que el frontend reciba array
    const ventas = result.rows.map(v => ({
      ...v,
      productos: JSON.parse(v.productos)
    }));

    res.json(ventas);
  } catch (error) {
    console.error("❌ Error al consultar ventas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


