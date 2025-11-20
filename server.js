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
    console.error('Error conectando a la base de datos:', err.stack);
  } else {
    console.log('✅ Conectado a PostgreSQL');
    release();
  }
});

// ==========================================
// ENDPOINTS QUE EXPONES (Otros te llaman)
// ==========================================

// Interface #3: SOLICITA_CATALOGO (GV -> VPC)
// GV solicita tu catálogo de productos
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
    
    res.json({
      success: true,
      catalogo: result.rows,
      total_productos: result.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo catálogo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Interface #5: VERIF_DISP (GV -> VPC)
// GV verifica disponibilidad de productos
app.post('/api/verificar-disponibilidad', async (req, res) => {
  try {
    const { productos } = req.body; // Array de {id_producto, cantidad}
    
    const verificaciones = await Promise.all(
      productos.map(async (item) => {
        const result = await pool.query(
          'SELECT id_catalogo, nombre, stock FROM catalogo_productos WHERE id_catalogo = $1',
          [item.id_producto]
        );
        
        if (result.rows.length === 0) {
          return {
            id_producto: item.id_producto,
            disponible: false,
            motivo: 'Producto no encontrado'
          };
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
    
    res.json({
      success: true,
      verificaciones,
      todos_disponibles: verificaciones.every(v => v.disponible)
    });
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Interface #12: REG_VTA_PROD (GV -> VPC)
// GV registra una venta en tu sistema
app.post('/api/registrar-venta', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      order_id,
      store_id,
      productos, // Array de {product_external_id, product_name, price, quantity, size, color, options}
      cliente,
      direccion_envio,
      payment_status
    } = req.body;
    
    // 1. Crear o buscar cliente
    let id_cliente;
    if (cliente && cliente.correo) {
      const clienteExistente = await client.query(
        'SELECT id_cliente FROM cliente WHERE correo = $1',
        [cliente.correo]
      );
      
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
    
    // 2. Calcular total
    const total = productos.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    // 3. Crear pedido
    const nuevoPedido = await client.query(
      `INSERT INTO pedido (id_cliente, total, estado, direccion_envio, observaciones) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id_pedido`,
      [id_cliente, total, 'pendiente', direccion_envio, `Order ID: ${order_id}`]
    );
    
    const id_pedido = nuevoPedido.rows[0].id_pedido;
    
    // 4. Crear detalles del pedido y actualizar stock
    for (const prod of productos) {
      // Buscar el producto en tu catálogo
      const productoLocal = await client.query(
        'SELECT id_catalogo, stock FROM catalogo_productos WHERE id_catalogo = $1',
        [prod.product_external_id]
      );
      
      if (productoLocal.rows.length > 0) {
        const id_producto = productoLocal.rows[0].id_catalogo;
        const stockActual = productoLocal.rows[0].stock;
        
        // Verificar stock
        if (stockActual < prod.quantity) {
          throw new Error(`Stock insuficiente para producto ${prod.product_name}`);
        }
        
        // Crear detalle
        await client.query(
          `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [id_pedido, id_producto, prod.quantity, prod.price, prod.price * prod.quantity]
        );
        
        // Actualizar stock
        await client.query(
          'UPDATE catalogo_productos SET stock = stock - $1 WHERE id_catalogo = $2',
          [prod.quantity, id_producto]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // 5. Si el pago está confirmado, procesar envío
    let envio_info = null;
    if (payment_status === 'approved' || payment_status === 'completed') {
      envio_info = await solicitarEnvio(id_pedido, direccion_envio, productos);
    }
    
    res.json({
      success: true,
      id_pedido,
      order_id,
      total,
      estado: 'registrado',
      envio: envio_info
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando venta:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// ==========================================
// ENDPOINTS QUE CONSUMES (Tú llamas a otros)
// ==========================================

// Interface #7: SOL_ENV (VPC -> GE)
// Solicitar envío a Gestión de Entregas
async function solicitarEnvio(id_pedido, direccion, productos) {
  try {
    const GE_URL = process.env.GE_API_URL || 'http://localhost:4000';
    
    const response = await fetch(`${GE_URL}/api/solicitar-envio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_orden_externa: id_pedido,
        id_orden_original: id_pedido,
        servicio_origen: 'VPC',
        datos_cliente: {
          direccion
        },
        productos: productos.map(p => ({
          nombre: p.product_name,
          cantidad: p.quantity
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error('Error al solicitar envío');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error solicitando envío:', error);
    return { success: false, error: error.message };
  }
}

// Interface #1: DATOS_TRANS (VPC -> BCO)
// Procesar pago con el Banco
async function procesarPago(id_pedido, monto, cta_cliente) {
  try {
    const BCO_URL = process.env.BCO_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${BCO_URL}/api/procesar-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        no_trans: `VPC-${Date.now()}`,
        cta_orig: cta_cliente,
        cta_dest: process.env.CUENTA_STARDUST || '1234567890',
        monto,
        cvv: '000' // En producción esto vendría del cliente
      })
    });
    
    if (!response.ok) {
      throw new Error('Error procesando pago');
    }
    
    const resultado = await response.json();
    
    // Registrar el pago en tu BD
    if (resultado.success) {
      await pool.query(
        `INSERT INTO pago (id_pedido, metodo, monto, estado, referencia_banco)
         VALUES ($1, $2, $3, $4, $5)`,
        [id_pedido, 'transferencia', monto, 'aprobado', resultado.no_trans]
      );
    }
    
    return resultado;
  } catch (error) {
    console.error('Error procesando pago:', error);
    return { success: false, error: error.message };
  }
}

// Interface #4: CATALOGO (VPC -> GV)
// Enviar catálogo a Gestión de Ventas (proactivo)
async function enviarCatalogoAGV() {
  try {
    const GV_URL = process.env.GV_API_URL || 'http://localhost:3001';
    
    const catalogo = await pool.query('SELECT * FROM catalogo_productos WHERE stock > 0');
    
    const response = await fetch(`${GV_URL}/api/recibir-catalogo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 1,
        store_name: 'Stardust',
        productos: catalogo.rows
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error enviando catálogo a GV:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// ENDPOINTS ADICIONALES ÚTILES
// ==========================================

// Crear producto en catálogo
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
    console.error('Error creando producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todos los pedidos
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
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener detalle de un pedido
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
    
    res.json({
      success: true,
      pedido: pedido.rows[0],
      detalles: detalles.rows
    });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar stock de producto
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
    console.error('Error actualizando stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Stardust Cafetería API',
    timestamp: new Date().toISOString()
  });
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
      health: 'GET /health'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Stardust API corriendo en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

app.get('/docs', (req, res) => {
  res.send('Documentación no disponible aquí. Revisa el README.md o el endpoint raíz "/"');
});

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stardust Cafetería API',
      version: '1.0.0',
    },
  },
  apis: ['./server.js'], // o donde tengas tus rutas
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



module.exports = app;