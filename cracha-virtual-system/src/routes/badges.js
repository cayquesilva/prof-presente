const express = require("express");
const router = express.Router();

const {
  createUserBadge,
  getUserBadge,
  getMyUserBadge,
  validateUserBadge,
  searchUsersByName, // Importe a função de busca
} = require("../controllers/badgeController");

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireCheckinPermission, // Importe a permissão de check-in
} = require("../middleware/auth");

// Rota para a busca de usuários por nome para o check-in
// O frontend está chamando GET /api/badges/search
router.get(
  "/search",
  authenticateToken,
  requireCheckinPermission,
  searchUsersByName
);

// Outras rotas que você já deve ter...
router.post("/users/:userId", authenticateToken, requireAdmin, createUserBadge);
router.get(
  "/users/:userId",
  authenticateToken,
  requireOwnershipOrAdmin,
  getUserBadge
);
router.get("/my", authenticateToken, getMyUserBadge);
router.post(
  "/validate",
  authenticateToken,
  requireCheckinPermission,
  validateUserBadge
);

module.exports = router;
