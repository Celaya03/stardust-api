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
      const id_producto = p.product_external_id;

      // Validar existencia en productos usando id_producto
      const result = await pool.query(
        `SELECT id_producto 
         FROM productos 
         WHERE id_producto = $1 AND store_id = $2`,
        [id_producto, 3]
      );

      if (result.rows.length === 0) {
        throw new Error(`Producto con id_producto ${id_producto} no encontrado`);
      }

      // Actualizar stock
      await pool.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id_producto = $2 AND store_id = $3`,
        [p.quantity, id_producto, 3]
      );

      // Guardar SOLO product_external_id (que es igual a id_producto)
      productosFinal.push({
        product_external_id: id_producto,
        quantity: p.quantity,
        nombre: p.nombre,
        precio_unitario: p.precio_unitario
      });
    }

    // Insertar la venta como UNA sola fila
    await pool.query(
      `INSERT INTO ventas (order_id, store_id, price, productos, payment_status)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (order_id) DO UPDATE
         SET price = EXCLUDED.price,
             productos = EXCLUDED.productos,
             payment_status = EXCLUDED.payment_status,
             created_at = NOW()`,
      [
        order_id,
        3,
        price,
        JSON.stringify(productosFinal),
        payment_status
      ]
    );

    // Preparar body para el servicio de envíos (usa product_external_id)
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
        sku: p.product_external_id, // externo = interno
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
   VALUES ($1,$2,$3,$4,NOW())
   ON CONFLICT (id_orden_externa) DO UPDATE
     SET codigo_seguimiento = EXCLUDED.codigo_seguimiento,
         estado_actual = EXCLUDED.estado_actual,
         ubicacion_actual = EXCLUDED.ubicacion_actual,
         fecha_actualizacion = EXCLUDED.fecha_actualizacion`,
  [order_id, codigoSeguimiento, "pendiente", "almacén"]
);


    res.json({
      mensaje: "Venta y envío registrados correctamente",
      order_id,
      codigo_seguimiento: codigoSeguimiento
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
      `SELECT order_id, store_id, price, productos, payment_status, created_at
       FROM ventas
       ORDER BY created_at DESC`
    );

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





