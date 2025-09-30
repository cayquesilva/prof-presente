const express = require('express');
const router = express.Router();

const {
  getCheckinReport,
  getFrequencyReport,
  getFrequencyRanking,
  getSystemReport,
} = require('../controllers/reportController');

const { 
  authenticateToken, 
  requireAdmin 
} = require('../middleware/auth');

// Relatório de check-ins de um evento (apenas admin)
router.get('/checkins/:eventId', authenticateToken, requireAdmin, getCheckinReport);

// Relatório de frequência de um evento (apenas admin)
router.get('/frequency/:eventId', authenticateToken, requireAdmin, getFrequencyReport);

// Ranking geral de frequência (apenas admin)
router.get('/ranking', authenticateToken, requireAdmin, getFrequencyRanking);

// Relatório geral do sistema (apenas admin)
router.get('/system', authenticateToken, requireAdmin, getSystemReport);

module.exports = router;

