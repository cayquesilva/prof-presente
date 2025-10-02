const express = require('express');
const router = express.Router();

// Importar todas as rotas
const authRoutes = require('./auth');
const userRoutes = require('./users');
const eventRoutes = require('./events');
const enrollmentRoutes = require('./enrollments');
const badgeRoutes = require('./badges');
const teacherBadgeRoutes = require('./teacherBadges');
const userBadgeRoutes = require('./userBadges');
const checkinRoutes = require('./checkins');
const awardRoutes = require('./awards');
const evaluationRoutes = require('./evaluations');
const reportRoutes = require('./reports');
const workplaceRoutes = require('./workplaces');


// Configurar rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/badges', badgeRoutes);
router.use('/teacher-badges', teacherBadgeRoutes);
router.use('/user-badges', userBadgeRoutes);
router.use('/checkins', checkinRoutes);
router.use('/awards', awardRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/reports', reportRoutes);
router.use('/workplaces', workplaceRoutes);

// Rota de status da API
router.get('/status', (req, res) => {
  res.json({
    message: 'API do Sistema de Crachás Virtuais está funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rota de documentação básica
router.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API do Sistema de Crachás Virtuais',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      enrollments: '/api/enrollments',
      badges: '/api/badges',
      teacherBadges: '/api/teacher-badges',
      userBadges: '/api/user-badges',
      checkins: '/api/checkins',
      awards: '/api/awards',
      evaluations: '/api/evaluations',
      reports: '/api/reports',
    }
  });
});

module.exports = router;

