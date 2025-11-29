const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db'); // conexión central a PostgreSQL

// Procesar pago y registrar transacción
router.post('/procesar-pago', async (req, res) => {
  console.log("📨 Solicitud de pago recibida:", JSON.stringify(req.body, null, 2));

  try {
    const datosPago = req.body;

    // Validación de campos obligatorios
    const camposObligatorios = [
      'NumeroTarjetaOrigen', 'NumeroTarjetaDestino', 'NombreCliente',
      'MesExp', 'AnioExp', 'Cvv', 'Monto'
    ];
    const faltantes = camposObligatorios.filter(campo => !datosPago[campo]);
    if (faltantes.length > 0) {
      console.warn("⚠️ Body incompleto. Faltan:", faltantes);
      return res.status(400).json({ error: "Faltan parámetros", faltantes });
    }

    // Mandar al banco
    const respuestaBanco = await axios.post(
      'https://bancarata.vercel.app/api/bank',
      datosPago,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const trx = respuestaBanco.data;
    console.log("📥 Respuesta del banco:", JSON.stringify(trx, null, 2));

    // Guardar en BD con ON CONFLICT para evitar duplicados
    await pool.query(
      `INSERT INTO transacciones_banco (
        creadautc, idtransaccion, tipotransaccion, montotransaccion,
        numerotarjeta, nombreestado, firma, descripcion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (idtransaccion)
      DO UPDATE SET
        creadautc = EXCLUDED.creadautc,
        tipotransaccion = EXCLUDED.tipotransaccion,
        montotransaccion = EXCLUDED.montotransaccion,
        numerotarjeta = EXCLUDED.numerotarjeta,
        nombreestado = EXCLUDED.nombreestado,
        firma = EXCLUDED.firma,
        descripcion = EXCLUDED.descripcion`,
      [
        trx.CreadaUTC,
        trx.IdTransaccion,
        trx.TipoTransaccion,
        trx.MontoTransaccion,
        trx.NumeroTarjeta,
        trx.NombreEstado,
        trx.Firma,
        trx.Descripcion
      ]
    );

    res.json({ mensaje: "Pago procesado y guardado", banco: trx });
  } catch (error) {
    console.error("❌ Error procesando pago:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Consultar todas las transacciones
router.get('/procesar-pago', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM transacciones_banco ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error consultando transacciones:", err.message);
    res.status(500).json({ error: "Error consultando transacciones" });
  }
});

module.exports = router;




