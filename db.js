// db.js
const { Pool } = require('pg');

//const pool = new Pool({
//  host: process.env.DB_HOST,
//  port: process.env.DB_PORT,
//  user: process.env.DB_USER,
//  password: process.env.DB_PASSWORD,
//  database: process.env.DB_NAME,
//  ssl: process.env.NODE_ENV === 'production'
//    ? { rejectUnauthorized: false } // Render requiere SSL
//    : false // en local no necesitas SSL
//});

// db test en caso de error capaz y es culpa de esto

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Render necesita SSL
  }
});

module.exports = pool;



