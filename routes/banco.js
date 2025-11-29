const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db'); // conexión central a PostgreSQL

// Procesar pago y registrar transacción
router.post('/procesar-pago', async (req, res) => {
  console.log('📨 Solicitud recibida en /procesar-pago:', new Date().toISOString());

  try {
    const datosPago = req.body;

    const { NumeroTarjetaOrigen, NumeroTarjetaDestino, NombreCliente, MesExp, AnioExp, Cvv, Monto } = datosPago;
    if (!NumeroTarjetaOrigen || !NumeroTarjetaDestino || !NombreCliente || !MesExp || !AnioExp || !Cvv || !Monto) {
      console.warn("⚠️ Body incompleto:", datosPago);
      return res.status(400).json({ error: "Faltan parámetros en la petición" });
    }

    const respuestaBanco = await axios.post(
      'https://bancarata.vercel.app/api/bank',
      datosPago,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const trx = respuestaBanco.data;
    console.log("📥 Respuesta del banco:", trx);

    const values = [
      trx.CreadaUTC,
      trx.IdTransaccion,
      trx.TipoTransaccion,
      trx.MontoTransaccion,
      trx.NumeroTarjeta,
      trx.NombreEstado,
      trx.Firma,
      trx.Descripcion
    ];

    // Verificar valores antes de insertar
    for (let i = 0; i < values.length; i++) {
      if (values[i] === undefined || values[i] === null) {
        console.warn(`⚠️ Valor faltante en posición ${i}:`, values[i]);
      }
    }

    const insertSQL = `
      INSERT INTO transacciones_banco (
        creadaUTC,
        idtransaccion,
        tipotransaccion,
        montotransaccion,
        numerotarjeta,
        nombreestado,
        Firma,
        descripcion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;

    console.log("📦 Intentando insertar en BD:", values);

    let result;
    try {
      result = await pool.query(insertSQL, values);
      console.log("✅ Transacción guardada en BD:", result.rows[0]);
    } catch (dbError) {
      console.error("❌ ERROR REAL DE BD:", dbError.stack);
      return res.status(500).json({
        error: "Error guardando en la base de datos",
        detalle: dbError.message
      });
    }

    return res.status(200).json({
      mensaje: 'Pago procesado y registrado',
      transaccion: result.rows[0],
      banco: trx
    });
  } catch (error) {
    console.error('❌ Error procesando pago:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Error interno procesando el pago.' });
  }
});

// Consultar transacciones registradas
router.get('/transacciones_banco', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM transacciones_banco ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error consultando transacciones:", err.message);
    res.status(500).json({ error: "Error consultando transacciones" });
  }
});

module.exports = router;













//// services/bancoService.js
//export async function enviarTransaccionAlBanco(datosTransaccion) {
//    const respuesta = await fetch("https://bancarata.vercel.app/api/bank", {
//        method: "POST",
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify(datosTransaccion)
//    });

//    if (!respuesta.ok) {
//        throw new Error("Error en la transacción con el banco");
//    }

//    return await respuesta.json();
//}

//// controllers/pagoController.js
//import { pool } from "../db.js";
//import { enviarTransaccionAlBanco } from "../services/bancoService.js";

//export async function procesarPago(req, res) {
//    try {
//        const { id_pedido, monto, datosTarjeta } = req.body;

//        // 1️⃣ Mandar al banco
//        const respuestaBanco = await enviarTransaccionAlBanco({
//            NumeroTarjetaOrigen: datosTarjeta.numero,
//            NumeroTarjetaDestino: "5555555555554444", // tu cuenta destino
//            NombreCliente: datosTarjeta.nombre,
//            MesExp: datosTarjeta.mesExp,
//            AnioExp: datosTarjeta.anioExp,
//            Cvv: datosTarjeta.cvv,
//            Monto: monto
//        });

//        // 2️⃣ Validar respuesta
//        if (respuestaBanco.NombreEstado !== "ACEPTADA") {
//            return res.status(402).json({
//                mensaje: "Pago rechazado por banco",
//                detalle: respuestaBanco
//            });
//        }

//        // 3️⃣ Guardar en la base de datos
//        const insertSQL = `
//      INSERT INTO pago
//      (id_pedido, monto, estado, referencia_banco, marca_tarjeta, numero_autorizacion)
//      VALUES ($1, $2, $3, $4, $5, $6)
//      RETURNING *;
//    `;

//        const valores = [
//            id_pedido,
//            monto,
//            respuestaBanco.NombreEstado, // "ACEPTADA"
//            respuestaBanco.NumeroAutorizacion,
//            respuestaBanco.MarcaTarjeta,
//            respuestaBanco.NumeroAutorizacion
//        ];

//        const result = await pool.query(insertSQL, valores);

//        // 4️⃣ Devolver resultado final
//        return res.json({
//            mensaje: "Pago exitoso y registrado",
//            pago: result.rows[0],
//            banco: respuestaBanco
//        });

//    } catch (error) {
//        console.error("Error procesando pago:", error);
//        return res.status(500).json({ error: "Error interno del servidor" });
//    }
//}

// Conexión a PostgreSQL
//const pool = new Pool({
//    connectionString: process.env.DATABASE_URL,
//    ssl: { rejectUnauthorized: false }
//});

//// ENDPOINT PARA PROCESAR PAGO
//router.post('/procesar-pago', async (req, res) => {
//    try {
//        const datosPago = req.body;

//        // 1️⃣ Mandar datos al banco
//        const respuestaBanco = await axios.post(
//            "https://bancarata.vercel.app/api/bank",
//            datosPago
//        );

//        // 2️⃣ Si el banco rechaza el pago
//        if (respuestaBanco.status !== 200) {
//            return res.status(400).json({ mensaje: "Transacción rechazada por el banco." });
//        }

//        const trx = respuestaBanco.data;

//        // 3️⃣ Guardar transacción aprobada en tu base de datos
//        const query = `
//      INSERT INTO transaccion_bancaria (
//        creada_utc, id_transaccion, tipo_transaccion, monto_transaccion,
//        marca_tarjeta, numero_tarjeta, numero_autorizacion,
//        nombre_estado, firma, mensaje
//      )
//      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
//      RETURNING *;
//    `;

//        const values = [
//            trx.CreadaUTC,
//            trx.id_transaccion,
//            trx.TipoTransaccion,
//            trx.MontoTransaccion,
//            trx.MarcaTarjeta,
//            trx.NumeroTarjeta,
//            trx.NumeroAutorizacion,
//            trx.NombreEstado,
//            trx.Firma,
//            trx.Mensaje
//        ];

//        const result = await pool.query(query, values);

//        // 4️⃣ Responder al cliente final
//        return res.status(200).json({
//            mensaje: "Pago aprobado y registrado.",
//            transaccionGuardada: result.rows[0]
//        });

//    } catch (error) {
//        console.error("Error en el pago:", error);
//        return res.status(500).json({ mensaje: "Error interno procesando el pago." });
//    }
//});
