const express = require("express");
const router = express.Router();

const {
  enrollInEvent,
  getUserEnrollments,
  getEventEnrollments,
  cancelEnrollment,
  updateEnrollmentStatus,
} = require("../controllers/enrollmentController");

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
} = require("../middleware/auth");

// Inscrever usuário em evento
router.post("/events/:eventId/enroll", authenticateToken, enrollInEvent);

// Listar inscrições de um usuário
router.get(
  "/users/:userId",
  authenticateToken,
  requireOwnershipOrAdmin,
  getUserEnrollments
);

// Listar inscrições de um evento (apenas admin)
router.get(
  "/events/:eventId",
  authenticateToken,
  requireAdmin,
  getEventEnrollments
);

// Listar inscrições do usuário logado
router.get("/my-enrollments", authenticateToken, (req, res, next) => {
  // Define o userId a partir do token de autenticação
  req.params.userId = req.user.id;
  // Reutiliza o controller que já suporta paginação e filtros
  return getUserEnrollments(req, res, next);
});
// Cancelar inscrição
router.patch("/:enrollmentId/cancel", authenticateToken, cancelEnrollment);

// Atualizar status da inscrição (apenas admin)
router.patch(
  "/:enrollmentId/status",
  authenticateToken,
  requireAdmin,
  updateEnrollmentStatus
);

module.exports = router;
