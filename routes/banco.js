const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/procesar-pago', async (req, res) => {
  console.log('📨 Entró a /procesar-pago');

  try {
    const trx = req.body;
    console.log("📥 Datos recibidos:", JSON.stringify(trx, null, 2));

    const requiredFields = [
      'CreadaUTC', 'IdTransaccion', 'TipoTransaccion',
      'MontoTransaccion', 'NumeroTarjeta', 'NombreEstado',
      'Firma', 'Descripcion'
    ];

    for (const field of requiredFields) {
      if (!trx[field]) {
        throw new Error(`Campo faltante o vacío: ${field}`);
      }
    }

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

    console.log("📦 Valores a insertar:", values);

    const insertSQL = `
      INSERT INTO transacciones_banco (
        creadautc, idtransaccion, tipotransaccion, montotransaccion,
        numerotarjeta, nombreestado, firma, descripcion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;

    const result = await pool.query(insertSQL, values);

    if (result.rows.length === 0) {
      throw new Error("El INSERT no devolvió ninguna fila");
    }

    console.log("✅ Fila insertada:", result.rows[0]);

    res.status(200).json({
      mensaje: 'Transacción registrada',
      transaccion: result.rows[0]
    });

  } catch (error) {
    console.error("❌ ERROR en /procesar-pago:", error.message);
    res.status(500).json({ error: error.message });
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
