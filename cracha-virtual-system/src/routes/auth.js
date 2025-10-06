const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  registerValidation,
  loginValidation,
} = require("../controllers/authController");

const { authenticateToken } = require("../middleware/auth");
const { uploadProfilePhoto } = require("../middleware/upload");

// Rotas públicas
router.post("/register", uploadProfilePhoto, registerValidation, register);
router.post("/login", loginValidation, login);

// Rotas protegidas
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
