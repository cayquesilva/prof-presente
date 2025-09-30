const express = require('express');
const router = express.Router();

const {
  performCheckin,
  getEventCheckins,
  getUserCheckins,
  getEventCheckinStats,
} = require('../controllers/checkinController');

const { 
  authenticateToken, 
  requireAdmin,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

// Realizar check-in
router.post('/', authenticateToken, performCheckin);

// Listar check-ins de um evento (apenas admin)
router.get('/events/:eventId', authenticateToken, requireAdmin, getEventCheckins);

// Listar check-ins de um usuário
router.get('/users/:userId', authenticateToken, requireOwnershipOrAdmin, getUserCheckins);

// Listar check-ins do usuário logado
router.get('/my', authenticateToken, (req, res, next) => {
  req.params.userId = req.user.id;
  return getUserCheckins(req, res, next);
});

// Obter estatísticas de check-in de um evento (apenas admin)
router.get('/events/:eventId/stats', authenticateToken, requireAdmin, getEventCheckinStats);

module.exports = router;

