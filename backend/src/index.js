const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables (único archivo .env del proyecto, en backend/)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const serviceRoutes = require('./routes/services');
const productRoutes = require('./routes/products');
const clientRoutes = require('./routes/clients');
const whatsappRoutes = require('./routes/whatsapp');
// Rutas específicas de la plataforma Actitud & Bienestar
const citaRoutes = require('./routes/citas');
const tareaRoutes = require('./routes/tareas');
const contactoRoutes = require('./routes/contactos');

const app = express();

// ---------------------------------------------------------------------
// CORS: permite el acceso desde el frontend (junto con credenciales).
// Se lee de la variable CORS_ORIGINS (comas separadas) o se usan
// valores por defecto: el dominio público y el local de desarrollo.
// ---------------------------------------------------------------------
const defaultOrigins = [
  'https://agendaactybien.pxxl.click',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://jomar71.github.io'
];

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat(defaultOrigins);

app.use(cors({
  origin(origin, callback) {
    // Permitir peticiones sin origen (curl, Postman, apps de servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Permitir cualquier subdominio de pxxl.click
    if (/\.pxxl\.click$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/contactos', contactoRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'NailArt Studio API is running!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});