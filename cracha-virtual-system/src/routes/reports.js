const express = require("express");
const router = express.Router();

const {
  getCheckinReport,
  getFrequencyReport,
  getFrequencyRanking,
  getSystemReport,
  getWorkplaceReport,
  getFilteredFrequencyReport,
  getAwardsReport,
  getEventSummaryReport,
} = require("../controllers/reportController");

const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Relatório de check-ins de um evento (apenas admin)
router.get(
  "/checkins/:eventId",
  authenticateToken,
  requireAdmin,
  getCheckinReport
);

// Relatório de frequência de um evento (apenas admin)
router.get(
  "/frequency/:eventId",
  authenticateToken,
  requireAdmin,
  getFrequencyReport
);

// Ranking geral de frequência (apenas admin)
router.get("/ranking", authenticateToken, requireAdmin, getFrequencyRanking);

// Relatório geral do sistema (apenas admin)
router.get("/system", authenticateToken, requireAdmin, getSystemReport);

// Estatísticas gerais do sistema (apenas admin)
router.get("/statistics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { prisma } = require("../config/database");

    const [totalEvents, totalUsers, activeEnrollments, totalCheckins] =
      await Promise.all([
        prisma.event.count(),
        prisma.user.count(),
        prisma.enrollment.count({
          where: {
            status: "APPROVED",
          },
        }),
        prisma.userCheckin.count(),
      ]);

    res.json({
      totalEvents,
      totalUsers,
      activeEnrollments,
      totalCheckins,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

// Relatório de frequência de um evento (apenas admin)
router.get(
  "/frequency/:eventId",
  authenticateToken,
  requireAdmin,
  getFrequencyReport
);

// NOVO: Relatório de frequência por escola (apenas admin)
router.get(
  "/workplace/:workplaceId",
  authenticateToken,
  requireAdmin,
  getWorkplaceReport
);

// NOVO: Relatório de frequência com filtros (apenas admin)
router.get(
  "/frequency/by-filter",
  authenticateToken,
  requireAdmin,
  getFilteredFrequencyReport
);

// NOVO: Relatório de premiações (apenas admin)
router.get("/awards", authenticateToken, requireAdmin, getAwardsReport);

// NOVO: Relatório de resumo de um evento (apenas admin)
router.get(
  "/event-summary/:eventId",
  authenticateToken,
  requireAdmin,
  getEventSummaryReport
);

module.exports = router;
