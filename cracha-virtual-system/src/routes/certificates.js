const express = require("express");
const router = express.Router();
const { generateCertificate } = require("../controllers/certificateController");
const { authenticateToken } = require("../middleware/auth");

// Rota para o usuário baixar seu próprio certificado
router.get(
  "/event/:parentEventId/user/:userId",
  authenticateToken,
  generateCertificate
);

module.exports = router;
