const express = require("express");
const router = express.Router();

const {
  getBadgeByEnrollment,
  generateBadgeImage,
  getQRCode,
  validateQRCode,
  getAllBadges,
  getMyBadges, // Importar nova função
  downloadBadgeImage, // Importar nova função
} = require("../controllers/badgeController");

const { authenticateToken, requireAdmin } = require("../middleware/auth");

// NOVA ROTA: Listar crachás do usuário logado
router.get("/my-badges", authenticateToken, getMyBadges);

// Obter crachá por ID da inscrição
router.get(
  "/enrollment/:enrollmentId",
  authenticateToken,
  getBadgeByEnrollment
);

// Gerar imagem do crachá virtual
router.get(
  "/enrollment/:enrollmentId/image",
  authenticateToken,
  generateBadgeImage
);

// Obter QR code do crachá
router.get("/enrollment/:enrollmentId/qrcode", authenticateToken, getQRCode);

// NOVA ROTA: Download da imagem do crachá
router.get("/:badgeId/download", authenticateToken, downloadBadgeImage);

// Validar QR code (para check-in)
router.post("/validate-qr", authenticateToken, validateQRCode);

// Listar todos os crachás (apenas admin)
router.get("/", authenticateToken, requireAdmin, getAllBadges);

module.exports = router;
