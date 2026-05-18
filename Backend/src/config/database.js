const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error de conexión:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL');
    release();
  }
});

module.exports = { pool };