const express = require('express');
const { body } = require('express-validator');
const whatsappController = require('../controllers/whatsappController');

const router = express.Router();

// Estado de la integración (útil para diagnóstico)
router.get('/status', whatsappController.getStatus);

// Enviar mensaje de confirmación
router.post('/send', [
  body('to').isString().notEmpty().withMessage('El número destino es obligatorio'),
  body('message').isString().notEmpty().withMessage('El mensaje es obligatorio')
], whatsappController.sendMessage);

module.exports = router;
