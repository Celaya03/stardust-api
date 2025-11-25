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

const pool = new Pool({

  user: 'stardust_db_d9gz_user',
  host: 'dpg-d4eggenpm1nc738r2nk0-a.oregon-postgres.render.com',
  database: 'stardust_db_d9gz',
  password: '8JDv0jWJdK4L0UpmmiO0TAdKnxhPrZmV',
  port: 5432,

    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // necesario para Render
    }
});

module.exports = pool;


