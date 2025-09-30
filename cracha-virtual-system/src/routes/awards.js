const express = require('express');
const router = express.Router();

const {
  getAllAwards,
  createAward,
  getUserAwards,
  grantAwardToUser,
  getAwardsRanking,
  awardValidation,
} = require('../controllers/awardController');

const { 
  authenticateToken, 
  requireAdmin,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

// Listar todas as premiações (público)
router.get('/', getAllAwards);

// Criar premiação (apenas admin)
router.post('/', authenticateToken, requireAdmin, awardValidation, createAward);

// Listar premiações de um usuário
router.get('/users/:userId', authenticateToken, requireOwnershipOrAdmin, getUserAwards);

// Conceder premiação a um usuário (apenas admin)
router.post('/grant', authenticateToken, requireAdmin, grantAwardToUser);

// Ranking de usuários por premiações (público)
router.get('/ranking', getAwardsRanking);

module.exports = router;

