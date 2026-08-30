const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importar rutas activas de Actitud & Bienestar
const authRoutes = require('./routes/auth');
const citaRoutes = require('./routes/citas');
const tareaRoutes = require('./routes/tareas');
const contactoRoutes = require('./routes/contactos');

const app = express();

// ---------------------------------------------------------------------
// Configuración Robusta de CORS
// ---------------------------------------------------------------------
const defaultOrigins = [
  'https://agendaactybien.pxxl.click',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://jomar71.github.io'
];

const customOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...customOrigins])];

app.use(cors({
  origin(origin, callback) {
    // Permitir peticiones sin origen (ej: herramientas CLI, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    // Permitir orígenes exactos autorizados
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Permitir cualquier subdominio o dominio de desarrollo local (localhost / 127.0.0.1 en cualquier puerto)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Permitir cualquier subdominio de pxxl.click o github.io
    if (/(\.pxxl\.click|\.github\.io)$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Acceso denegado por CORS para el origen: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/contactos', contactoRoutes);

// Endpoint raíz de diagnóstico / salud
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Actitud & Bienestar API',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/citas',
      '/api/tareas',
      '/api/contactos'
    ]
  });
});

// Manejador 404 para rutas no existentes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.stack || err.message);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Actitud & Bienestar activo en http://localhost:${PORT}`);
  console.log(`⚙️  Entorno: ${process.env.NODE_ENV || 'development'}`);
});