const express = require('express');
const citaController = require('../controllers/citaController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de citas requieren un token JWT válido y
// están limitadas al usuario autenticado (req.user.id).

// GET /api/citas → citas del usuario
router.get('/', authenticateToken, citaController.getAll);

// GET /api/citas/:id
router.get('/:id', authenticateToken, citaController.getById);

// POST /api/citas
router.post('/', authenticateToken, citaController.create);

// PUT /api/citas/:id
router.put('/:id', authenticateToken, citaController.update);

// DELETE /api/citas/:id
router.delete('/:id', authenticateToken, citaController.remove);

module.exports = router;
