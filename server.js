// Importaciones
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

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

// Verificar disponibilidad
app.post('/api/verificar-disponibilidad', async (req, res) => {
  const { productos } = req.body; // [{ id_producto, cantidad }]
  try {
    const disponibilidad = [];
    for (const p of productos) {
      const result = await pool.query(
        'SELECT stock FROM catalogo_productos WHERE id_producto = $1',
        [p.id_producto]
      );
      const stock = result.rows[0]?.stock || 0;
      disponibilidad.push({
        id_producto: p.id_producto,
        solicitado: p.cantidad,
        disponible: stock >= p.cantidad
      });
    }
    res.json(disponibilidad);
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar venta con integración de pago
app.post('/api/registrar-venta', async (req, res) => {
  const { cliente_id, productos, respuestaBanco } = req.body;

  try {
    // Guardar pago
    const pagoResult = await pool.query(
      `INSERT INTO pago (
        id_transaccion, nombre_comercio, tipo_transaccion, monto, moneda,
        marca_tarjeta, numero_tarjeta, numero_autorizacion, estado, firma,
        mensaje, creada_utc
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id_pago`,
      [
        respuestaBanco.IdTransaccion,
        respuestaBanco.NombreComercio,
        respuestaBanco.TipoTransaccion,
        respuestaBanco.MontoTransaccion,
        respuestaBanco.Moneda,
        respuestaBanco.MarcaTarjeta,
        respuestaBanco.NumeroTarjeta,
        respuestaBanco.NumeroAutorizacion,
        respuestaBanco.NombreEstado,
        respuestaBanco.Firma,
        respuestaBanco.Mensaje,
        respuestaBanco.CreadaUTC
      ]
    );

    const id_pago = pagoResult.rows[0].id_pago;

    // Crear pedido
    const pedidoResult = await pool.query(
      `INSERT INTO pedido (cliente_id, id_pago, fecha) 
       VALUES ($1, $2, NOW()) RETURNING id_pedido`,
      [cliente_id, id_pago]
    );

    const id_pedido = pedidoResult.rows[0].id_pedido;

    // Guardar detalle de productos y actualizar stock
    for (const p of productos) {
      await pool.query(
        `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad) 
         VALUES ($1, $2, $3)`,
        [id_pedido, p.id_producto, p.cantidad]
      );
      await pool.query(
        `UPDATE catalogo_productos SET stock = stock - $1 WHERE id_producto = $2`,
        [p.cantidad, p.id_producto]
      );
    }

    res.json({ mensaje: 'Venta registrada', id_pedido, id_pago });
  } catch (error) {
    console.error('Error al registrar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Catálogo filtrado por tienda
app.post('/api/catalogo-por-tienda', async (req, res) => {
  const { store_id } = req.body;
  try {
    const resultado = await pool.query(
      'SELECT * FROM catalogo_productos WHERE store_id = $1',
      [store_id]
    );
    res.json({ tienda: store_id, productos: resultado.rows });
  } catch (error) {
    console.error('Error al obtener catálogo por tienda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ============================
   INICIO DEL SERVIDOR
   ============================ */
app.listen(PORT, () => {
  console.log(`🚀 Stardust API corriendo en puerto ${PORT}`);
});
