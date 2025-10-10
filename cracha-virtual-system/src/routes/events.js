const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  eventValidation,
  uploadEventBadgeTemplate,
  generatePrintableBadges,
  uploadCertificateTemplate,
  sendEventCertificates,
  getCertificateLogsForEvent,
} = require("../controllers/eventController");

const { authenticateToken, requireAdmin } = require("../middleware/auth");

const {
  uploadBadgeTemplate,
  uploadCertificate,
} = require("../middleware/upload");

// Listar todos os eventos (público)
router.get("/", authenticateToken, getAllEvents);

// Obter evento por ID (público)
router.get("/:id", getEventById);

// Rota para gerar o PDF com os crachás para impressão em lote
router.get(
  "/:id/print-badges",
  authenticateToken,
  requireAdmin,
  generatePrintableBadges
);

// Criar evento
router.post("/", authenticateToken, eventValidation, createEvent);

// Rota para criar/atualizar o modelo de crachá de um evento
router.post(
  "/:id/badge-template",
  authenticateToken,
  requireAdmin,
  uploadBadgeTemplate, // Middleware para o upload da imagem
  uploadEventBadgeTemplate
);

// Atualizar evento (apenas admin)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  eventValidation,
  updateEvent
);

// Deletar evento (apenas admin)
router.delete("/:id", authenticateToken, requireAdmin, deleteEvent);

//Criar certificados para o evento
router.post(
  "/:id/certificate-template",
  authenticateToken,
  requireAdmin,
  uploadCertificate,
  uploadCertificateTemplate
);

router.post(
  "/:id/send-certificates",
  authenticateToken, // Middleware de autenticação
  requireAdmin, // Middleware que verifica se é admin
  sendEventCertificates // Nova função no controller
);

router.get(
  "/:id/certificate-logs",
  authenticateToken,
  requireAdmin,
  getCertificateLogsForEvent // Nova função no controller
);

module.exports = router;
