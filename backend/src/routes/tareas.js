const express = require('express');
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de tareas requieren un token JWT válido y
// están limitadas al usuario autenticado (req.user.id).

// GET /api/tareas → tareas del usuario
router.get('/', authenticateToken, taskController.getAll);

// GET /api/tareas/:id
router.get('/:id', authenticateToken, taskController.getById);

// POST /api/tareas
router.post('/', authenticateToken, taskController.create);

// PUT /api/tareas/:id
router.put('/:id', authenticateToken, taskController.update);

// DELETE /api/tareas/:id
router.delete('/:id', authenticateToken, taskController.remove);

module.exports = router;
