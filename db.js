const { Pool } = require('pg');
const path = require('path');
// El proyecto usa UN solo .env, ubicado en backend/
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL correctamente');
  }
});

module.exports = pool;