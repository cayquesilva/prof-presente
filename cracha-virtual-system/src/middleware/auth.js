const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(403).json({ 
      error: 'Token inválido' 
    });
  }
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acesso negado. Permissões de administrador requeridas.' 
    });
  }
  next();
};

// Middleware para verificar se o usuário pode acessar o recurso (próprio usuário ou admin)
const requireOwnershipOrAdmin = (req, res, next) => {
  const userId = req.params.userId || req.params.id;

  if (req.user.role === 'ADMIN' || req.user.id === userId) {
    next();
  } else {
    return res.status(403).json({
      error: 'Acesso negado. Você só pode acessar seus próprios dados.'
    });
  }
};

// Middleware para verificar se o usuário pode fazer check-in (ADMIN ou CHECKIN_COORDINATOR)
const requireCheckinPermission = (req, res, next) => {
  const allowedRoles = ['ADMIN', 'CHECKIN_COORDINATOR'];

  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores e coordenadores de check-in podem realizar esta ação.'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireCheckinPermission,
};

