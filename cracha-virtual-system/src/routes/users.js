const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfilePhoto,
  updateUserValidation,
} = require('../controllers/userController');

const { 
  authenticateToken, 
  requireAdmin, 
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

const { 
  uploadProfilePhoto, 
  handleUploadError 
} = require('../middleware/upload');

// Listar todos os usuários (apenas admin)
router.get('/', authenticateToken, requireAdmin, getAllUsers);

// Obter usuário por ID
router.get('/:id', authenticateToken, requireOwnershipOrAdmin, getUserById);

// Atualizar usuário
router.put('/:id', authenticateToken, requireOwnershipOrAdmin, updateUserValidation, updateUser);

// Deletar usuário (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

// Upload de foto do perfil
router.post('/:id/photo', 
  authenticateToken, 
  requireOwnershipOrAdmin,
  uploadProfilePhoto,
  handleUploadError,
  updateProfilePhoto
);

module.exports = router;

