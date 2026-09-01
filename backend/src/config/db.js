const dotenv = require('dotenv');
const path = require('path');

// Único archivo .env del proyecto, ubicado en backend/
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// ============================================================================
// ADAPTADOR DE BASE DE DATOS DUAL (PostgreSQL + MySQL)
// ----------------------------------------------------------------------------
// - En producción (pxxl) se usa PostgreSQL (el que pxxl ya tenía provisionado),
//   detectado por DATABASE_URL con prefijo postgresql://
// - En desarrollo local se usa MySQL, detectado por variables DB_* o por
//   DATABASE_URL con prefijo mysql://
//
// Los modelos siempre escriben con placeholders '?' y llaman a
// pool.query(sql, params) → Promise<{ rows, insertId?, affectedRows? }>.
// Este adaptador traduce '?' → '$n' cuando el motor es PostgreSQL.
// ============================================================================

const ENGINE = detectEngine();

function detectEngine() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (url) {
    if (/^postgres(ql)?:\/\//i.test(url)) return 'postgres';
    if (/^mysql(2)?:\/\//i.test(url)) return 'mysql';
  }
  // Sin DATABASE_URL → variables DB_* (entorno local MySQL)
  return 'mysql';
}

function buildConfig() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (url) {
    if (ENGINE === 'postgres') {
      return {
        connectionString: url,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      };
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

let raw;
let convertPlaceholders;
let mysqlPool = null;
let pgPool = null;

if (ENGINE === 'postgres') {
  const pg = require('pg');
  pgPool = new pg.Pool(config);
  raw = pgPool;

  // Los modelos escriben '?'; PostgreSQL exige $1, $2... → convertimos por orden.
  convertPlaceholders = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };
} else {
  const mysql = require('mysql2/promise');
  mysqlPool = mysql.createPool({
    ...config,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  });
  raw = mysqlPool;
  // MySQL usa '?' tal cual; además convertimos cualquier '$n' heredado de
  // PostgreSQL (controllers/middleware viejos) a '?'.
  convertPlaceholders = (sql) => sql.replace(/\$\d+/g, '?');
}

// A los INSERT de PostgreSQL que no traen RETURNING, les añadimos
// "RETURNING id" para poder exponer insertId (los modelos re-leen por insertId).
function ensurePostgresInsertId(sql) {
  if (ENGINE !== 'postgres') return sql;
  const trimmed = sql.trim();
  if (!/^INSERT/i.test(trimmed)) return sql;
  if (/RETURNING/i.test(trimmed)) return sql;
  return sql + ' RETURNING id';
}

const pool = {
  async query(sql, params = []) {
    const finalSql = ensurePostgresInsertId(sql);
    if (ENGINE === 'postgres') {
      const result = await pgPool.query(convertPlaceholders(finalSql), params);
      const rows = result.rows || [];
      const isInsert =
        /^INSERT/i.test(finalSql.trim()) && rows.length && rows[0].id != null;
      return {
        rows,
        insertId: isInsert ? rows[0].id : null,
        affectedRows: result.rowCount ?? null
      };
    }
    const result = await mysqlPool.execute(convertPlaceholders(finalSql), params);
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
  raw,
  convertPlaceholders,
  engine: ENGINE
};

// Verificación de conexión (no bloquea el arranque del servidor)
(async () => {
  try {
    if (ENGINE === 'postgres') {
      await pgPool.query('SELECT 1');
      console.log('✅ Conectado a PostgreSQL correctamente (producción)');
    } else {
      const conn = await mysqlPool.getConnection();
      await conn.query('SELECT 1');
      conn.release();
      console.log('✅ Conectado a MySQL correctamente (local)');
    }
  } catch (err) {
    console.error(`❌ Error conectando a ${ENGINE}:`, err.message);
  }
})();

module.exports = pool;
