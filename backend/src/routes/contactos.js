const express = require('express');
const contactController = require('../controllers/contactController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de contactos requieren un token JWT válido y
// están limitadas al usuario autenticado (req.user.id).

// GET /api/contactos → contactos del usuario
router.get('/', authenticateToken, contactController.getAll);

// GET /api/contactos/:id
router.get('/:id', authenticateToken, contactController.getById);

// POST /api/contactos
router.post('/', authenticateToken, contactController.create);

// PUT /api/contactos/:id
router.put('/:id', authenticateToken, contactController.update);

// DELETE /api/contactos/:id
router.delete('/:id', authenticateToken, contactController.remove);

module.exports = router;
