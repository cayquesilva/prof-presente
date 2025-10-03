// NOVO: Arquivo de rotas dedicado para os rankings da aplicação.
const express = require("express");
const router = express.Router();

const { getCheckinRanking } = require("../controllers/rankingController");
const { authenticateToken } = require("../middleware/auth");

// Rota pública para obter o ranking geral de check-ins.
router.get("/checkins", getCheckinRanking);

module.exports = router;
