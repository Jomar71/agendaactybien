const express = require('express');
const contactController = require('../controllers/contactController');
const { authenticateToken, authorizeNotTerapeuta } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de contactos requieren un token JWT válido y
// están limitadas al usuario autenticado (req.user.id).
// Los terapeutas no tienen acceso al módulo de directorio.

// GET /api/contactos → contactos del usuario
router.get('/', authenticateToken, authorizeNotTerapeuta, contactController.getAll);

// GET /api/contactos/:id
router.get('/:id', authenticateToken, authorizeNotTerapeuta, contactController.getById);

// POST /api/contactos
router.post('/', authenticateToken, authorizeNotTerapeuta, contactController.create);

// PUT /api/contactos/:id
router.put('/:id', authenticateToken, authorizeNotTerapeuta, contactController.update);

// DELETE /api/contactos/:id
router.delete('/:id', authenticateToken, authorizeNotTerapeuta, contactController.remove);

module.exports = router;
