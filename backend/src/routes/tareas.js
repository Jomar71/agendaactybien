const express = require('express');
const taskController = require('../controllers/taskController');
const { authenticateToken, authorizeNotTerapeuta } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de tareas requieren un token JWT válido y
// están limitadas al usuario autenticado (req.user.id).
// Los terapeutas no tienen acceso a módulos de tareas.

// GET /api/tareas → tareas del usuario
router.get('/', authenticateToken, authorizeNotTerapeuta, taskController.getAll);

// GET /api/tareas/:id
router.get('/:id', authenticateToken, authorizeNotTerapeuta, taskController.getById);

// POST /api/tareas
router.post('/', authenticateToken, authorizeNotTerapeuta, taskController.create);

// PUT /api/tareas/:id
router.put('/:id', authenticateToken, authorizeNotTerapeuta, taskController.update);

// DELETE /api/tareas/:id
router.delete('/:id', authenticateToken, authorizeNotTerapeuta, taskController.remove);

module.exports = router;
