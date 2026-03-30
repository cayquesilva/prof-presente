const express = require('express');
const router = express.Router();
const liveStreamController = require('../controllers/liveStreamController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const youtubeService = require('../services/youtubeService');

// ==========================================
// YOUTUBE OAUTH ROUTES
// ==========================================

router.get('/youtube/auth', authenticateToken, requireAdmin, (req, res) => {
    try {
        const url = youtubeService.getAuthUrl();
        res.json({ url });
    } catch (error) {
        console.error('Erro ao gerar URL do YouTube:', error);
        res.status(500).json({ error: error.message || 'Falha ao conectar com YouTube.' });
    }
});

router.get('/youtube/callback', async (req, res) => {
    const { code } = req.query;
    try {
        if (!code) throw new Error('Código de autorização não fornecido.');

        await youtubeService.handleCallback(code);

        // Redirect back to frontend admin settings with success
        const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/admin?tab=streaming&youtube=success`);
    } catch (error) {
        console.error('Erro no callback do YouTube:', error);
        const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/admin?tab=streaming&youtube=error`);
    }
});

// ==========================================
// EVENT STREAMS ROUTES
// ==========================================

// Rotas Administrativas (Eventos)
router.post('/events/:eventId', authenticateToken, requireAdmin, liveStreamController.upsertLiveStream);

// Rota do Participante
router.get('/events/:eventId', authenticateToken, liveStreamController.getLiveStream);

// Rotas da Live (Ping e Chat Histórico)
router.post('/:id/ping', authenticateToken, liveStreamController.pingAttendance);
router.get('/:id/chat', authenticateToken, liveStreamController.getChatHistory);

module.exports = router;
