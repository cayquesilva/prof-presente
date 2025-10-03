// NOVO: Este arquivo substitui userBadges.js e agora é a rota principal para crachás.
const express = require("express");
const router = express.Router();

// ALTERAÇÃO: O controller importado agora é o novo badgeController unificado.
const {
  createUserBadge,
  getUserBadge,
  getMyUserBadge,
  validateUserBadge,
  searchUsersByName,
} = require("../controllers/badgeController");

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
} = require("../middleware/auth");

// Rota para buscar usuários por nome (autocomplete no check-in).
router.get("/search", authenticateToken, searchUsersByName);

// Rota para validar um crachá (código manual ou QR Code).
router.post("/validate", authenticateToken, validateUserBadge);

// Rota para o usuário logado obter seu próprio crachá universal.
router.get("/my-badge", authenticateToken, getMyUserBadge);

// Rota para um admin criar um crachá para um usuário.
router.post("/:userId", authenticateToken, requireAdmin, createUserBadge);

// Rota para obter o crachá de um usuário específico.
router.get(
  "/:userId",
  authenticateToken,
  requireOwnershipOrAdmin,
  getUserBadge
);

module.exports = router;
