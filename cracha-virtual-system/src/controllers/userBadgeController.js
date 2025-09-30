const { prisma } = require('../config/database');
const { generateQRCode } = require('../utils/qrcode');

// Gerar código legível do crachá (nome + números)
const generateBadgeCode = (userName) => {
  // Pegar primeiro nome e sobrenome
  const names = userName.trim().split(' ');
  const firstName = names[0].toUpperCase();
  const lastName = names.length > 1 ? names[names.length - 1].toUpperCase() : '';

  // Gerar 4 dígitos aleatórios
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);

  // Formato: NOME-SOBRENOME-1234 ou NOME-1234 se não tiver sobrenome
  if (lastName) {
    return `${firstName}-${lastName}-${randomNumbers}`;
  }
  return `${firstName}-${randomNumbers}`;
};

// Criar crachá universal do usuário
const createUserBadge = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se já existe crachá para o usuário
    const existingBadge = await prisma.userBadge.findUnique({
      where: { userId }
    });

    if (existingBadge) {
      return res.status(409).json({
        error: 'Usuário já possui um crachá',
        badge: existingBadge
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Gerar código legível único
    let badgeCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      badgeCode = generateBadgeCode(user.name);
      const existing = await prisma.userBadge.findUnique({
        where: { badgeCode }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Não foi possível gerar um código único para o crachá' });
    }

    // Dados para o QR code
    const qrData = JSON.stringify({
      userId: user.id,
      badgeCode,
      badgeType: 'user',
      timestamp: new Date().toISOString(),
    });

    // Gerar QR code
    const qrCodeFilename = `user_badge_${user.id}`;
    await generateQRCode(qrData, qrCodeFilename);
    const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;

    const badgeImageUrl = `/api/user-badges/${user.id}/image`;

    // Criar crachá
    const userBadge = await prisma.userBadge.create({
      data: {
        userId: user.id,
        badgeCode,
        qrCodeUrl,
        badgeImageUrl,
      },
    });

    res.status(201).json({
      message: 'Crachá universal criado com sucesso',
      badge: userBadge
    });

  } catch (error) {
    console.error('Erro ao criar crachá universal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter crachá universal do usuário
const getUserBadge = async (req, res) => {
  try {
    const { userId } = req.params;

    const userBadge = await prisma.userBadge.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
          }
        },
        userCheckins: {
          orderBy: { checkinTime: 'desc' },
          take: 10
        },
        _count: {
          select: {
            userCheckins: true
          }
        }
      }
    });

    if (!userBadge) {
      return res.status(404).json({ error: 'Crachá não encontrado' });
    }

    // Verificar permissões
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este crachá' });
    }

    res.json(userBadge);

  } catch (error) {
    console.error('Erro ao obter crachá:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter meu crachá universal
const getMyUserBadge = async (req, res) => {
  try {
    const userId = req.user.id;

    let userBadge = await prisma.userBadge.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
          }
        },
        userCheckins: {
          orderBy: { checkinTime: 'desc' },
          take: 10
        },
        _count: {
          select: {
            userCheckins: true
          }
        }
      }
    });

    // Se não existir, criar automaticamente
    if (!userBadge) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Gerar código legível único
      let badgeCode;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        badgeCode = generateBadgeCode(user.name);
        const existing = await prisma.userBadge.findUnique({
          where: { badgeCode }
        });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ error: 'Não foi possível gerar um código único para o crachá' });
      }

      const qrData = JSON.stringify({
        userId: user.id,
        badgeCode,
        badgeType: 'user',
        timestamp: new Date().toISOString(),
      });

      const qrCodeFilename = `user_badge_${user.id}`;
      await generateQRCode(qrData, qrCodeFilename);
      const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;
      const badgeImageUrl = `/api/user-badges/${user.id}/image`;

      userBadge = await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeCode,
          qrCodeUrl,
          badgeImageUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photoUrl: true,
            }
          },
          _count: {
            select: {
              userCheckins: true
            }
          }
        }
      });
    }

    res.json(userBadge);

  } catch (error) {
    console.error('Erro ao obter meu crachá:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Validar código ou QR code do crachá
const validateUserBadge = async (req, res) => {
  try {
    const { badgeCode, qrData } = req.body;

    let userBadge;

    if (qrData) {
      // Validar por QR code
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (parseError) {
        return res.status(400).json({ error: 'Formato de QR code inválido' });
      }

      const { userId, badgeType } = parsedData;

      if (!userId || badgeType !== 'user') {
        return res.status(400).json({ error: 'QR code inválido' });
      }

      userBadge = await prisma.userBadge.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        }
      });
    } else if (badgeCode) {
      // Validar por código
      userBadge = await prisma.userBadge.findUnique({
        where: { badgeCode: badgeCode.toUpperCase() },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        }
      });
    } else {
      return res.status(400).json({ error: 'Código ou QR code são obrigatórios' });
    }

    if (!userBadge) {
      return res.status(404).json({
        error: 'Crachá não encontrado',
        valid: false
      });
    }

    res.json({
      message: 'Crachá válido',
      valid: true,
      badge: {
        id: userBadge.id,
        badgeCode: userBadge.badgeCode,
        user: userBadge.user,
        type: 'user'
      }
    });

  } catch (error) {
    console.error('Erro ao validar crachá:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar usuários por nome (para autocomplete)
const searchUsersByName = async (req, res) => {
  try {
    const { query, eventId } = req.query;

    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    const where = {
      name: {
        contains: query,
        mode: 'insensitive'
      }
    };

    // Se eventId foi fornecido, filtrar apenas usuários inscritos no evento
    if (eventId) {
      where.enrollments = {
        some: {
          eventId,
          status: 'APPROVED'
        }
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    // Incluir badge code de cada usuário
    const usersWithBadges = await Promise.all(
      users.map(async (user) => {
        const badge = await prisma.userBadge.findUnique({
          where: { userId: user.id },
          select: { badgeCode: true }
        });
        return {
          ...user,
          badgeCode: badge?.badgeCode || null
        };
      })
    );

    res.json({ users: usersWithBadges });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createUserBadge,
  getUserBadge,
  getMyUserBadge,
  validateUserBadge,
  searchUsersByName,
  generateBadgeCode,
};
