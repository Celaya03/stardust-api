const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ============================
   ENDPOINTS BÁSICOS
   ============================ */

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



//banco
const bancoRoutes = require('./routes/banco');
app.use('/api/banco', bancoRoutes);


// Envíos (webhook y movimientos)
const enviosRoutes = require('./routes/envios');
app.use('/api/envios', enviosRoutes);

// Catálogo de productos
const catalogoRoutes = require('./routes/catalogo');
app.use('/api/catalogo', catalogoRoutes);

// Disponibilidad de productos
const disponibilidadRoutes = require('./routes/disponibilidad');
app.use('/api/disponibilidad', disponibilidadRoutes);

// Venta de productos
const ventaRoutes = require('./routes/venta');
app.use('/api/venta', ventaRoutes);

// Test DB connection
const pool = require('./db'); // Ajusta la ruta si estás en otro archivo
app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ conectado: true, hora_servidor: result.rows[0].now });
  } catch (error) {
    console.error('❌ Error de conexión a la base:', error.message);
    res.status(500).json({ conectado: false, error: error.message });
  }
});

/* ============================
   INICIO DEL SERVIDOR
   ============================ */
app.listen(PORT, () => {
  console.log(`🚀 Stardust API corriendo en puerto ${PORT}`);
});

