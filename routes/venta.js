const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.post('/producto', async (req, res) => {
  const {
    order_id: externalOrderId,
    price,
    products,
    payment_status,
    cliente   // 👈 aquí recibimos el objeto cliente del body
  } = req.body;

  try {
    let order_id;

    if (externalOrderId) {
      order_id = externalOrderId;
    } else {
      const resultSeq = await pool.query("SELECT nextval('orden_seq') AS numero");
      const numero = resultSeq.rows[0].numero;
      order_id = `ORD-${String(numero).padStart(3, '0')}`;
    }

    const productosFinal = [];

    // Validar y actualizar stock
    for (const p of products) {
      const id_producto = String(
        p["external_id"] || p.external_id || p.product_external_id
      );

      if (!id_producto) {
        throw new Error("Producto sin identificador externo válido");
      }

      const result = await pool.query(
        `SELECT id_producto 
         FROM productos 
         WHERE id_producto = $1 AND store_id = $2`,
        [id_producto, 3]
      );

      if (result.rows.length === 0) {
        throw new Error(`Producto con id_producto ${id_producto} no encontrado`);
      }

      await pool.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id_producto = $2 AND store_id = $3`,
        [p.quantity, id_producto, 3]
      );

      productosFinal.push({
        product_external_id: id_producto,
        quantity: p.quantity,
        nombre: p.nombre,
        precio_unitario: p.precio_unitario
      });
    }

    // Insertar la venta como UNA sola fila
    const insertVenta = await pool.query(
      `INSERT INTO ventas (order_id, store_id, price, productos, payment_status)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (order_id) DO UPDATE
         SET price = EXCLUDED.price,
             productos = EXCLUDED.productos,
             payment_status = EXCLUDED.payment_status,
             created_at = NOW()
       RETURNING id`,
      [order_id, 3, price, JSON.stringify(productosFinal), payment_status]
    );

    const id = insertVenta.rows[0].id;

    // Preparar body para el servicio de envíos
    const datosEnvio = {
      id_orden_externa: order_id,
      id_orden_original: `P-${order_id}`,
      servicio_origen: "Cafetería Stardust",
      webhook_url: "https://stardust-api-6e7j.onrender.com/api/envios/webhook-envios",
      datos_cliente: {
        nombre: cliente?.nombre || "Cliente",
        direccion: cliente?.direccion || "Sin dirección",
        telefono: cliente?.telefono || "Sin teléfono",
        email: cliente?.email || "Sin email"
      },
      productos: productosFinal.map(p => ({
        sku: p.product_external_id,
        nombre: p.nombre || "Producto",
        cantidad: p.quantity,
        precio_unitario: p.precio_unitario || price
      }))
    };

    const respuestaEnvios = await axios.post(
      "https://gestion-envios-sz3x.onrender.com/ordenes",
      datosEnvio,
      { headers: { "Content-Type": "application/json" } }
    );

    const codigoSeguimiento = respuestaEnvios.data.codigo_seguimiento;
await pool.query(
  `INSERT INTO edo_env (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha_actualizacion)
   VALUES ($1,$2,$3,$4,$5)
   ON CONFLICT (id_orden_externa) DO UPDATE
     SET codigo_seguimiento = EXCLUDED.codigo_seguimiento,
         estado_actual = EXCLUDED.estado_actual,
         ubicacion_actual = EXCLUDED.ubicacion_actual,
         fecha_actualizacion = EXCLUDED.fecha_actualizacion`,
  [id_orden_externa, codigoSeguimiento, estado_actual, ubicacion_actual, fecha_actualizacion]
);


    // 👉 Armar comprobante
    const comprobante = {
      order_id,
      id,
      cliente: {
        nombre: cliente?.nombre || "Cliente",
        direccion: cliente?.direccion || "Sin dirección",
        telefono: cliente?.telefono || "Sin teléfono",
        email: cliente?.email || "Sin email"
      },
      productos: productosFinal,
      total: price,
      payment_status,
      codigo_seguimiento: codigoSeguimiento,
      fecha: new Date().toISOString()
    };

    // 👉 Respuesta única y final
    res.json({
      mensaje: "Venta y envío registrados correctamente",
      comprobante
    });

  } catch (err) {
    if (err.response) {
      console.error("❌ Error en envío:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error registrando venta/envío:", err);
    }
    res.status(500).json({ error: "Error registrando venta/envío" });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.order_id, v.store_id, v.price, v.productos, v.payment_status, v.created_at,
              e.codigo_seguimiento, e.estado_actual, e.ubicacion_actual, e.fecha_actualizacion
       FROM ventas v
       LEFT JOIN edo_env e ON v.order_id = e.id_orden_externa
       ORDER BY v.created_at DESC`
    );

    const ventas = result.rows.map(v => ({
      ...v,
      productos: v.productos
    }));

    res.json(ventas);
  } catch (error) {
    console.error("❌ Error al consultar ventas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;






