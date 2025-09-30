const express = require('express');
const router = express.Router();

const {
  createTeacherBadge,
  getTeacherBadge,
  getMyTeacherBadge,
  validateTeacherQRCode,
  getTeacherRanking,
} = require('../controllers/teacherBadgeController');

const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/ranking', getTeacherRanking);

router.post('/validate', authenticateToken, validateTeacherQRCode);

router.get('/my-badge', authenticateToken, getMyTeacherBadge);

router.post('/:userId', authenticateToken, requireAdmin, createTeacherBadge);

router.get('/:userId', authenticateToken, getTeacherBadge);

module.exports = router;
