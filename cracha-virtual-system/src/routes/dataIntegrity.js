const express = require("express");
const router = express.Router();
const { syncTrackEnrollments } = require("../controllers/dataIntegrityController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Apenas administradores podem acessar
router.post("/sync-tracks", authenticateToken, requireAdmin, syncTrackEnrollments);

module.exports = router;
