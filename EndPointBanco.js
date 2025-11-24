import fetch from "node-fetch";
import { router } from "./server";

import express from 'express';
import axios from 'axios';
import pkg from 'pg';

const { Pool } = pkg;

const router = express.Router();

// Conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ENDPOINT PARA PROCESAR PAGO
router.post('/procesar-pago', async (req, res) => {
    try {
        const datosPago = req.body;

        // 1️⃣ Mandar datos al banco
        const respuestaBanco = await axios.post(
            "https://bancarata.vercel.app/api/bank",
            datosPago
        );

        // 2️⃣ Si el banco rechaza el pago
        if (respuestaBanco.status !== 200) {
            return res.status(400).json({ mensaje: "Transacción rechazada por el banco." });
        }

        const trx = respuestaBanco.data;

        // 3️⃣ Guardar transacción aprobada en tu base de datos
        const query = `
      INSERT INTO transaccion_bancaria (
        creada_utc, id_transaccion, tipo_transaccion, monto_transaccion,
        marca_tarjeta, numero_tarjeta, numero_autorizacion,
        nombre_estado, firma, mensaje
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

        const values = [
            trx.CreadaUTC,
            trx.id_transaccion,
            trx.TipoTransaccion,
            trx.MontoTransaccion,
            trx.MarcaTarjeta,
            trx.NumeroTarjeta,
            trx.NumeroAutorizacion,
            trx.NombreEstado,
            trx.Firma,
            trx.Mensaje
        ];

        const result = await pool.query(query, values);

        // 4️⃣ Responder al cliente final
        return res.status(200).json({
            mensaje: "Pago aprobado y registrado.",
            transaccionGuardada: result.rows[0]
        });

    } catch (error) {
        console.error("Error en el pago:", error);
        return res.status(500).json({ mensaje: "Error interno procesando el pago." });
    }
});

export default router;

// Endpoint para procesar pago
//router.post("/procesar-pago", async (req, res) => {
//    try {
//        const datosPago = req.body;
//        const urlBanco = "https://api-banco.com/transaccion"; // URL real del equipo banco

//        const respuesta = await fetch(urlBanco, {
//            method: "POST",
//            headers: { "Content-Type": "application/json" },
//            body: JSON.stringify(datosPago)
//        });

//        const resultado = await respuesta.json();

//        if (!respuesta.ok) {
//            return res.status(respuesta.status).json(resultado);
//        }

//        return res.status(200).json({
//            mensaje: "Pago procesado correctamente",
//            respuestaBanco: resultado
//        });

//    } catch (error) {
//        console.error("Error procesando pago:", error);
//        return res.status(500).json({
//            mensaje: "Error interno en el servicio de ventas",
//            error: error.message
//        });
//    }
//});

//export default router;