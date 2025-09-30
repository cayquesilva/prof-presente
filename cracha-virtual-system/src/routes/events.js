const express = require('express');
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  eventValidation,
} = require('../controllers/eventController');

const { 
  authenticateToken, 
  requireAdmin 
} = require('../middleware/auth');

// Listar todos os eventos (público)
router.get('/', getAllEvents);

// Obter evento por ID (público)
router.get('/:id', getEventById);

// Criar evento (apenas admin)
router.post('/', authenticateToken, requireAdmin, eventValidation, createEvent);

// Atualizar evento (apenas admin)
router.put('/:id', authenticateToken, requireAdmin, eventValidation, updateEvent);

// Deletar evento (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteEvent);

module.exports = router;

