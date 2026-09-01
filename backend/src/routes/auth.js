const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Verifica los errores de validación (expresados por express-validator)
// y responde 400 con el primer mensaje antes de llegar al controlador.
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

router.post('/register', [
  body('nombre').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('email').trim().isEmail().withMessage('Proporciona un correo electrónico válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], checkValidation, authController.register);

router.post('/login', [
  body('email').trim().notEmpty().withMessage('El correo o usuario es obligatorio'),
  body('password').exists().withMessage('La contraseña es obligatoria')
], checkValidation, authController.login);

router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;