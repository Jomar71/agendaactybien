const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Único archivo .env del proyecto, ubicado en backend/
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Normaliza la URL de conexión a un formato entendible por mysql2.
// Acepta tanto DATABASE_URL con prefijo mysql:// como variables DB_*.
function buildConfig() {
  const url = (process.env.DATABASE_URL || '').trim();

  if (url) {
    // Si la URL tiene prefijo postgres que el usuario aún no actualizó,
    // lo tratamos como error claro para que corrija el .env.
    if (/^postgres(ql)?:\/\//i.test(url)) {
      throw new Error(
        'DATABASE_URL apunta a PostgreSQL, pero el backend ahora usa MySQL. ' +
        'Actualiza DATABASE_URL a un connection string mysql:// en backend/.env'
      );
    }
    // mysql://usuario:pass@host:puerto/base
    const clean = url.replace(/^mysql(2)?:\/\//i, '');
    const [userpass, hostportdb] = clean.split('@');
    const [user, ...passParts] = userpass.split(':');
    const password = passParts.join(':');
    const [hostport, database] = hostportdb.split('/');
    const portMatch = hostport.match(/:(\d+)$/);
    const host = portMatch ? hostport.slice(0, portMatch.index) : hostport;
    const port = portMatch ? Number(portMatch[1]) : 3306;
    return { host, port, user, password, database, dateStrings: true };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true
  };
}

const config = buildConfig();

/** Pool subyacente de mysql2 (promisificado) */
const mysqlPool = mysql.createPool({
  ...config,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});

/** Convierte '... $1 ... $2' (PostgreSQL) en '... ? ... ?' (MySQL) */
function convertPlaceholders(sql) {
  return sql.replace(/\$\d+/g, '?');
}

// Exponemos un objeto `pool` con la MISMA interfaz que tenía el de
// PostgreSQL: pool.query(sql, params) → Promise<{ rows, insertId? }>.
// Internamente usa el pool de mysql2 y traduce los $n a ?.
const pool = {
  async query(sql, params = []) {
    const converted = convertPlaceholders(sql);
    const result = await mysqlPool.execute(converted, params);
    // SELECT → result[0] es un array de filas; INSERT/UPDATE/DELETE →
    // result[0] es un ResultSetHeader (tiene insertId / affectedRows).
    const data = result[0];
    if (Array.isArray(data)) {
      return { rows: data, insertId: null, affectedRows: null };
    }
    return {
      rows: [],
      insertId: data ? data.insertId : null,
      affectedRows: data ? data.affectedRows : null
    };
  },
  raw: mysqlPool,
  convertPlaceholders
};

// Verificación de conexión (no bloquea el arranque del servidor)
(async () => {
  try {
    const conn = await mysqlPool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    console.log('✅ Conectado a MySQL correctamente');
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  }
})();

module.exports = pool;
