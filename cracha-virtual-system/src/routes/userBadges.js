const express = require('express');
const router = express.Router();

const {
  createUserBadge,
  getUserBadge,
  getMyUserBadge,
  validateUserBadge,
  searchUsersByName,
} = require('../controllers/userBadgeController');

const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Buscar usuários por nome (para autocomplete no check-in)
router.get('/search', authenticateToken, searchUsersByName);

// Validar crachá
router.post('/validate', authenticateToken, validateUserBadge);

// Obter meu crachá universal
router.get('/my-badge', authenticateToken, getMyUserBadge);

// Criar crachá universal para um usuário (apenas admin)
router.post('/:userId', authenticateToken, requireAdmin, createUserBadge);

// Obter crachá de um usuário
router.get('/:userId', authenticateToken, getUserBadge);

module.exports = router;
