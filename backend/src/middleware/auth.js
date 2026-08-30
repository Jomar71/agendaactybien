const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token de autenticación.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nailart_studio_secret_key');
    
    // Verificar que el usuario aún exista en la base de datos
    const userResult = await pool.query('SELECT id, nombre, email, rol FROM users WHERE id = $1', [decoded.id]);

    if (!userResult.rows.length) {
      return res.status(401).json({ message: 'Token no válido. El usuario ya no existe.' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    // 401 para permitir que el frontend capture la expiración y solicite nuevo login
    return res.status(401).json({ message: 'Sesión expirada o token no válido.', error: error.message });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeAdmin
};