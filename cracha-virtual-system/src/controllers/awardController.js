const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');

// Validações para premiação
const awardValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Nome deve ter entre 3 e 255 caracteres'),
  body('criteria')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Critérios devem ter pelo menos 10 caracteres'),
];

// Listar todas as premiações
const getAllAwards = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const awards = await prisma.award.findMany({
      include: {
        _count: {
          select: {
            userAwards: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.award.count();

    res.json({
      awards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar premiações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Criar premiação
const createAward = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { name, description, imageUrl, criteria } = req.body;

    const award = await prisma.award.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        criteria,
      }
    });

    res.status(201).json({
      message: 'Premiação criada com sucesso',
      award
    });

  } catch (error) {
    console.error('Erro ao criar premiação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar premiações de um usuário
const getUserAwards = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const userAwards = await prisma.userAward.findMany({
      where: { userId },
      include: {
        award: true
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { awardedAt: 'desc' }
    });

    const total = await prisma.userAward.count({ where: { userId } });

    res.json({
      userAwards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar premiações do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Conceder premiação a um usuário
const grantAwardToUser = async (req, res) => {
  try {
    const { userId, awardId } = req.body;

    if (!userId || !awardId) {
      return res.status(400).json({
        error: 'ID do usuário e ID da premiação são obrigatórios'
      });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se a premiação existe
    const award = await prisma.award.findUnique({
      where: { id: awardId }
    });

    if (!award) {
      return res.status(404).json({
        error: 'Premiação não encontrada'
      });
    }

    // Verificar se o usuário já possui esta premiação
    const existingUserAward = await prisma.userAward.findUnique({
      where: {
        userId_awardId: {
          userId,
          awardId
        }
      }
    });

    if (existingUserAward) {
      return res.status(409).json({
        error: 'Usuário já possui esta premiação'
      });
    }

    // Conceder premiação
    const userAward = await prisma.userAward.create({
      data: {
        userId,
        awardId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        award: true
      }
    });

    res.status(201).json({
      message: 'Premiação concedida com sucesso',
      userAward
    });

  } catch (error) {
    console.error('Erro ao conceder premiação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Verificar e conceder premiações automáticas
const checkAndGrantAutomaticAwards = async (userId) => {
  try {
    // Exemplo de lógica para premiações automáticas
    
    // Premiação por número de check-ins
    const checkinCount = await prisma.checkin.count({
      where: {
        badge: {
          enrollment: {
            userId
          }
        }
      }
    });

    // Premiação por número de eventos participados
    const eventCount = await prisma.enrollment.count({
      where: {
        userId,
        status: 'APPROVED'
      }
    });

    // Buscar premiações automáticas disponíveis
    const awards = await prisma.award.findMany();

    for (const award of awards) {
      // Verificar se o usuário já possui esta premiação
      const hasAward = await prisma.userAward.findUnique({
        where: {
          userId_awardId: {
            userId,
            awardId: award.id
          }
        }
      });

      if (!hasAward) {
        let shouldGrant = false;

        // Lógica baseada nos critérios da premiação
        if (award.criteria.includes('5 check-ins') && checkinCount >= 5) {
          shouldGrant = true;
        } else if (award.criteria.includes('3 eventos') && eventCount >= 3) {
          shouldGrant = true;
        } else if (award.criteria.includes('10 check-ins') && checkinCount >= 10) {
          shouldGrant = true;
        }

        if (shouldGrant) {
          await prisma.userAward.create({
            data: {
              userId,
              awardId: award.id,
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Erro ao verificar premiações automáticas:', error);
  }
};

// Ranking de usuários por premiações
const getAwardsRanking = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ranking = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        photoUrl: true,
        _count: {
          select: {
            userAwards: true,
            enrollments: {
              where: { status: 'APPROVED' }
            }
          }
        }
      },
      orderBy: {
        userAwards: {
          _count: 'desc'
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.user.count();

    const rankingWithPosition = ranking.map((user, index) => ({
      position: skip + index + 1,
      ...user,
      totalAwards: user._count.userAwards,
      totalEvents: user._count.enrollments,
    }));

    res.json({
      ranking: rankingWithPosition,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao obter ranking de premiações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getAllAwards,
  createAward,
  getUserAwards,
  grantAwardToUser,
  checkAndGrantAutomaticAwards,
  getAwardsRanking,
  awardValidation,
};

