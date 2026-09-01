const { Pool } = require('pg'); 
const dotenv = require('dotenv');
const path = require('path');

// Único archivo .env del proyecto, ubicado en backend/
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Soporta dos formas de configuración:
//  1) DATABASE_URL (connection string completa, p. ej. la que entrega pxxl)
//  2) Variables individuales DB_USER / DB_HOST / DB_NAME / DB_PASSWORD / DB_PORT
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL successfully');
  }
});

module.exports = pool;