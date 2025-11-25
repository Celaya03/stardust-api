// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'stardust_db_d9gz_user',
  host: 'dpg-d4eggenpm1nc738r2nk0-a.oregon-postgres.render.com',
  database: 'stardust_db_d9gz',
  password: '8JDv0jWJdK4L0UpmmiO0TAdKnxhPrZmV',
  port: 5432,
});

module.exports = pool;


