// ==========================
// Stardust Cafetería API
// ==========================
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test de conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.stack);
  } else {
    console.log('✅ Conectado a PostgreSQL');
    release();
  }
});

// ==========================================
// ENDPOINTS QUE EXPONES (Otros te llaman)
// ==========================================

// Catálogo de productos
app.get('/api/catalogo', async (req, res) => {
  try {
    const { store_id } = req.query;
    let query = 'SELECT * FROM catalogo_productos WHERE stock > 0';
    const params = [];
    if (store_id) {
      query += ' AND store_id = $1';
      params.push(store_id);
    }
    const result = await pool.query(query, params);
    res.json({ success: true, catalogo: result.rows, total_productos: result.rows.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verificar disponibilidad
app.post('/api/verificar-disponibilidad', async (req, res) => {
  try {
    const { productos } = req.body;
    const verificaciones = await Promise.all(
      productos.map(async (item) => {
        const result = await pool.query(
          'SELECT id_catalogo, nombre, stock FROM catalogo_productos WHERE id_catalogo = $1',
          [item.id_producto]
        );
        if (result.rows.length === 0) {
          return { id_producto: item.id_producto, disponible: false, motivo: 'Producto no encontrado' };
        }
        const producto = result.rows[0];
        const disponible = producto.stock >= item.cantidad;
        return {
          id_producto: item.id_producto,
          nombre: producto.nombre,
          stock_actual: producto.stock,
          cantidad_solicitada: item.cantidad,
          disponible,
          motivo: disponible ? 'Disponible' : 'Stock insuficiente'
        };
      })
    );
    res.json({ success: true, verificaciones, todos_disponibles: verificaciones.every(v => v.disponible) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registrar venta
app.post('/api/registrar-venta', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { order_id, store_id, productos, cliente, direccion_envio, payment_status } = req.body;

    // Crear o buscar cliente
    let id_cliente;
    if (cliente && cliente.correo) {
      const clienteExistente = await client.query('SELECT id_cliente FROM cliente WHERE correo = $1', [cliente.correo]);
      if (clienteExistente.rows.length > 0) {
        id_cliente = clienteExistente.rows[0].id_cliente;
      } else {
        const nuevoCliente = await client.query(
          'INSERT INTO cliente (nombre, correo, telefono) VALUES ($1, $2, $3) RETURNING id_cliente',
          [cliente.nombre || 'Cliente', cliente.correo, cliente.telefono || null]
        );
        id_cliente = nuevoCliente.rows[0].id_cliente;
      }
    }

    // Calcular total
    const total = productos.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    // Crear pedido
    const nuevoPedido = await client.query(
      `INSERT INTO pedido (id_cliente, total, estado, direccion_envio, observaciones) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id_pedido`,
      [id_cliente, total, 'pendiente', direccion_envio, `Order ID: ${order_id}`]
    );
    const id_pedido = nuevoPedido.rows[0].id_pedido;

    // Detalles y stock
    for (const prod of productos) {
      const productoLocal = await client.query(
        'SELECT id_catalogo, stock FROM catalogo_productos WHERE id_catalogo = $1',
        [prod.product_external_id]
      );
      if (productoLocal.rows.length > 0) {
        const id_producto = productoLocal.rows[0].id_catalogo;
        const stockActual = productoLocal.rows[0].stock;
        if (stockActual < prod.quantity) throw new Error(`Stock insuficiente para ${prod.product_name}`);
        await client.query(
          `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [id_pedido, id_producto, prod.quantity, prod.price, prod.price * prod.quantity]
        );
        await client.query('UPDATE catalogo_productos SET stock = stock - $1 WHERE id_catalogo = $2',
          [prod.quantity, id_producto]);
      }
    }

    await client.query('COMMIT');

    // Procesar envío si pago aprobado
    let envio_info = null;
    if (payment_status === 'approved' || payment_status === 'completed') {
      envio_info = await solicitarEnvio(id_pedido, direccion_envio, productos);
    }

    res.json({ success: true, id_pedido, order_id, total, estado: 'registrado', envio: envio_info });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// ==========================================
// ENDPOINTS ADICIONALES
// ==========================================

// Crear producto
app.post('/api/productos', async (req, res) => {
  try {
    const { store_id, nombre, description, precio, stock, duracion_minutos } = req.body;
    const result = await pool.query(
      `INSERT INTO catalogo_productos (store_id, nombre, description, precio, stock, duracion_minutos)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [store_id || 1, nombre, description, precio, stock, duracion_minutos || null]
    );
    res.json({ success: true, producto: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nombre as nombre_cliente, c.correo
      FROM pedido p
      LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
      ORDER BY p.fecha_pedido DESC
    `);
    res.json({ success: true, pedidos: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Detalle de pedido
app.get('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await pool.query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    const detalles = await pool.query(`
      SELECT dp.*, cp.nombre
      FROM detalle_pedido dp
      JOIN catalogo_productos cp ON dp.id_producto = cp.id_catalogo
      WHERE dp.id_pedido = $1
    `, [id]);
    res.json({ success: true, pedido: pedido.rows[0], detalles: detalles.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar stock
app.patch('/api/productos/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    const result = await pool.query(
      'UPDATE catalogo_productos SET stock = $1 WHERE id_catalogo = $2 RETURNING *',
      [cantidad, id]
    );
    res.json({ success: true, producto: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Stardust Cafetería API', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Stardust Cafetería API',
    version: '1.0.0',
    endpoints: {
      catalogo: 'GET /api/catalogo',
      verificar_disponibilidad: 'POST /api/verificar-disponibilidad',
      registrar_venta: 'POST /api/registrar-venta',
      productos: 'GET/POST /api/productos',
      pedidos: 'GET /api/pedidos',
      detalle_pedido: 'GET /api/pedidos/:id',
      actualizar_stock: 'PATCH /api/productos/:id/stock',
      health: 'GET /health'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Stardust API corriendo en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;
