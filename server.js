
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
   IMPORTACIÓN DE RUTAS
   ============================ */

// Banco (procesar pagos y transacciones)
const bancoRoutes = require('./routes/banco');
app.use('/api/banco', bancoRoutes);

// Envíos (webhook y movimientos)
const enviosRoutes = require('./routes/envios');
app.use('/api/envios', enviosRoutes);

/* ============================
   INICIO DEL SERVIDOR
   ============================ */
app.listen(PORT, () => {
  console.log(`🚀 Stardust API corriendo en puerto ${PORT}`);
});


const pool = require('./db');

app.post('/db-test', async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO movimientos_envio (id_orden_externa, codigo_seguimiento, estado_actual, ubicacion_actual, fecha)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['TEST-001', 'ENV-TEST', 'Prueba', 'Hermosillo', new Date()]
    );

    res.json({ ok: true, insertado: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
