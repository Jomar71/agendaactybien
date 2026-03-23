const pool = require('./db');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as hora_actual');
    console.log('✅ CONECTADO A POSTGRESQL');
    console.log('Hora del servidor:', result.rows[0].hora_actual);
  } catch (error) {
    console.log('❌ ERROR DE CONEXIÓN');
    console.log(error.message);
  } finally {
    await pool.end();
  }
}

testConnection();