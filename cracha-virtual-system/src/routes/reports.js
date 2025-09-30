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

// Estatísticas gerais do sistema (apenas admin)
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const [totalEvents, totalUsers, activeEnrollments, totalCheckins] = await Promise.all([
      prisma.event.count(),
      prisma.user.count(),
      prisma.enrollment.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      }),
      prisma.checkin.count(),
    ]);

    res.json({
      totalEvents,
      totalUsers,
      activeEnrollments,
      totalCheckins,
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;

