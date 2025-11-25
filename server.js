// Importaciones
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const axios = require('axios');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Stardust Cafetería API',
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Stardust Cafetería API' });
});

 /* ============================
       DISPONIBILIDAD DE PRODUCTOS
       ============================ */
app.get('/api/disp-productos', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        id_catalogo,
        nombre,
        stock,
        CASE 
          WHEN stock > 0 THEN true
          ELSE false
        END AS disponible
      FROM catalogo_productos
      ORDER BY id_catalogo;
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ============================
   ENDPOINTS PRINCIPALES
   ============================ */

// Catálogo general
app.get('/api/catalogo', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM catalogo_productos');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/transacciones_banco', async (req, res) => {
    try {
        const resultado = await pool.query(`
         SELECT * FROM transacciones_banco ORDER BY id ASC
      `);

        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener transacciones del banco' });
    }
});

// Registrar venta con integración de pago + envíos
app.post('/api/registrar-venta', async (req, res) => {
  const { cliente_id, productos, respuestaBanco } = req.body;

  try {
    // Crear pedido
    const pedidoResult = await pool.query(
      `INSERT INTO pedido (id_cliente, fecha, total) 
       VALUES ($1, NOW(), 0) RETURNING id_pedido`,
      [cliente_id]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    let total = 0;

    // Guardar detalle de productos y actualizar stock
    for (const p of productos) {
      const prodResult = await pool.query(
        'SELECT precio FROM catalogo_productos WHERE id_catalogo = $1',
        [p.id_catalogo]
      );
      const precio = prodResult.rows[0].precio;
      const subtotal = precio * p.cantidad;
      total += subtotal;

      await pool.query(
        `INSERT INTO pedido_detalle (id_pedido, id_catalogo, cantidad, subtotal) 
         VALUES ($1, $2, $3, $4)`,
        [id_pedido, p.id_catalogo, p.cantidad, subtotal]
      );

      await pool.query(
        `UPDATE catalogo_productos SET stock = stock - $1 WHERE id_catalogo = $2`,
        [p.cantidad, p.id_catalogo]
      );
    }
    
    // Actualizar total del pedido
    await pool.query(
      'UPDATE pedido SET total = $1 WHERE id_pedido = $2',
      [total, id_pedido]
    );

    /* ============================
       INTEGRACIÓN CON GESTIÓN DE ENVÍOS
       ============================ */

    // Obtener datos del cliente desde tu BD
    const clienteResult = await pool.query(
      'SELECT nombre, correo AS email, telefono FROM cliente WHERE id_cliente = $1',
      [cliente_id]
    );
    const cliente = clienteResult.rows[0];

    // Obtener info de productos desde catálogo
    const productosInfo = [];
    for (const p of productos) {
      const prodResult = await pool.query(
        'SELECT nombre, precio FROM catalogo_productos WHERE id_catalogo = $1',
        [p.id_catalogo]
      );
      const prod = prodResult.rows[0];
      productosInfo.push({
        sku: `PROD-${p.id_catalogo}`,
        nombre: prod.nombre,
        cantidad: p.cantidad,
        precio_unitario: prod.precio
      });
    }

    // Construir payload para envíos
    const envioPayload = {
      id_orden_externa: `CAF-${id_pedido}`,
      id_orden_original: `P-${id_pedido}`,
      servicio_origen: "Cafetería Stardust",
      webhook_url: "https://stardust-api-6e7j.onrender.com/api/webhook-envios", // tu URL pública en Render
      datos_cliente: cliente,
      productos: productosInfo
    };

    // Enviar orden al servicio de envíos
    const responseEnvios = await axios.post("https://gestion-envios-sz3x.onrender.com/ordenes", envioPayload);

    // Guardar código de seguimiento en tu BD
    await pool.query(
      'UPDATE pedido SET codigo_seguimiento = $1 WHERE id_pedido = $2',
      [responseEnvios.data.codigo_seguimiento, id_pedido]
    );

    res.json({ mensaje: 'Venta registrada y orden enviada a envíos', id_pedido, total });
  } catch (error) {
    console.error('Error al registrar venta o enviar orden:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ============================
   WEBHOOK PARA NOTIFICACIONES DE ENVÍOS
   ============================ */
app.post('/api/webhook-envios', async (req, res) => {
  const { codigo_seguimiento, estado, fecha } = req.body;

  console.log("Notificación de envíos:", req.body);

  try {
    await pool.query(
      'UPDATE pedido SET estado_envio = $1 WHERE codigo_seguimiento = $2',
      [estado, codigo_seguimiento]
    );
    res.json({ recibido: true });
  } catch (error) {
    console.error("Error al procesar webhook:", error);
    res.status(500).json({ error: "Error interno al procesar webhook" });
  }
});

/* ============================
   INICIO DEL SERVIDOR
   ============================ */
app.listen(PORT, () => {
  console.log(`🚀 Stardust API corriendo en puerto ${PORT}`);
});
