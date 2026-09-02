const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Valores por defecto seguros para que el login funcione aunque el entorno
// no defina estas variables (p. ej. en pxxl/plan free).
const JWT_SECRET = process.env.JWT_SECRET || 'agendaactybien_clave_jwt_super_secreta_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authController = {
  // Register a new admin user
  register: async (req, res) => {
    try {
      const { nombre, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const newUser = await User.create(nombre, email, hashedPassword);

      // Generate token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: newUser.rol
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login', error: error.message });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ message: 'Server error getting profile', error: error.message });
    }
  }
};

module.exports = authController;