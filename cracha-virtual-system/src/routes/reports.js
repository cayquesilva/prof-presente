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
  getReportFilterOptions,
} = require("../controllers/reportController");

const { authenticateToken, requireAdmin } = require("../middleware/auth");

// --- ROTAS ESPECÍFICAS PRIMEIRO ---

// Rota para buscar as opções de filtro dos relatórios
router.get(
  "/filters/options",
  authenticateToken,
  requireAdmin,
  getReportFilterOptions
);

// Relatório de frequência com filtros (a rota mais específica de "/frequency")
router.get(
  "/frequency/by-filter",
  authenticateToken,
  requireAdmin,
  getFilteredFrequencyReport
);

// --- ROTAS GENÉRICAS / COM PARÂMETROS DEPOIS ---

// Relatório de check-ins de um evento
router.get(
  "/checkins/:eventId",
  authenticateToken,
  requireAdmin,
  getCheckinReport
);

// Relatório de frequência de um evento
router.get(
  "/frequency/:eventId",
  authenticateToken,
  requireAdmin,
  getFrequencyReport
);

// Relatório de frequência por escola
router.get(
  "/workplace/:workplaceId",
  authenticateToken,
  requireAdmin,
  getWorkplaceReport
);

// Relatório de resumo de um evento
router.get(
  "/event-summary/:eventId",
  authenticateToken,
  requireAdmin,
  getEventSummaryReport
);

// --- ROTAS GERAIS ---

// Relatório de premiações
router.get("/awards", authenticateToken, requireAdmin, getAwardsReport);

// Ranking geral de frequência
router.get("/ranking", authenticateToken, requireAdmin, getFrequencyRanking);

// Relatório geral do sistema
router.get("/system", authenticateToken, requireAdmin, getSystemReport);

// Estatísticas gerais do sistema
router.get("/statistics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { prisma } = require("../config/database");
    const [totalEvents, totalUsers, activeEnrollments, totalCheckins] =
      await Promise.all([
        prisma.event.count(),
        prisma.user.count(),
        prisma.enrollment.count({ where: { status: "APPROVED" } }),
        prisma.userCheckin.count(),
      ]);
    res.json({ totalEvents, totalUsers, activeEnrollments, totalCheckins });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

module.exports = router;
