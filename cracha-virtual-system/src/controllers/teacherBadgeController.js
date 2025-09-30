const { prisma } = require('../config/database');
const { generateQRCode } = require('../utils/qrcode');
const path = require('path');

const createTeacherBadge = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Apenas professores podem ter crachás universais' });
    }

    const existingBadge = await prisma.teacherBadge.findUnique({
      where: { userId }
    });

    if (existingBadge) {
      return res.status(409).json({
        error: 'Crachá de professor já existe para este usuário',
        badge: existingBadge
      });
    }

    const qrData = JSON.stringify({
      userId: user.id,
      badgeType: 'teacher',
      timestamp: new Date().toISOString(),
    });

    const qrCodeFilename = `teacher_badge_${user.id}`;
    await generateQRCode(qrData, qrCodeFilename);
    const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;

    const badgeImageUrl = `/api/teacher-badges/${user.id}/image`;

    const teacherBadge = await prisma.teacherBadge.create({
      data: {
        userId: user.id,
        qrCodeUrl,
        badgeImageUrl,
      },
    });

    res.status(201).json({
      message: 'Crachá de professor criado com sucesso',
      badge: teacherBadge
    });

  } catch (error) {
    console.error('Erro ao criar crachá de professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getTeacherBadge = async (req, res) => {
  try {
    const { userId } = req.params;

    const teacherBadge = await prisma.teacherBadge.findUnique({
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
        teacherCheckins: {
          orderBy: { checkinTime: 'desc' },
          take: 10
        }
      }
    });

    if (!teacherBadge) {
      return res.status(404).json({ error: 'Crachá de professor não encontrado' });
    }

    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este crachá' });
    }

    res.json(teacherBadge);

  } catch (error) {
    console.error('Erro ao obter crachá de professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getMyTeacherBadge = async (req, res) => {
  try {
    const userId = req.user.id;

    const teacherBadge = await prisma.teacherBadge.findUnique({
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
        teacherCheckins: {
          orderBy: { checkinTime: 'desc' },
          take: 10
        },
        _count: {
          select: {
            teacherCheckins: true
          }
        }
      }
    });

    if (!teacherBadge) {
      return res.status(404).json({
        error: 'Crachá de professor não encontrado. Entre em contato com o administrador.'
      });
    }

    res.json(teacherBadge);

  } catch (error) {
    console.error('Erro ao obter meu crachá de professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const validateTeacherQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ error: 'Dados do QR code são obrigatórios' });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({ error: 'Formato de QR code inválido' });
    }

    const { userId, badgeType } = parsedData;

    if (!userId || badgeType !== 'teacher') {
      return res.status(400).json({ error: 'QR code inválido' });
    }

    const teacherBadge = await prisma.teacherBadge.findUnique({
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

    if (!teacherBadge) {
      return res.status(404).json({
        error: 'Crachá de professor não encontrado',
        valid: false
      });
    }

    res.json({
      message: 'QR code de professor válido',
      valid: true,
      badge: {
        id: teacherBadge.id,
        user: teacherBadge.user,
        type: 'teacher'
      }
    });

  } catch (error) {
    console.error('Erro ao validar QR code de professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getTeacherRanking = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const rankings = await prisma.teacherBadge.findMany({
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
            teacherCheckins: true
          }
        }
      },
      orderBy: {
        teacherCheckins: {
          _count: 'desc'
        }
      },
      take: parseInt(limit)
    });

    const formattedRankings = rankings.map((badge, index) => ({
      position: index + 1,
      teacher: badge.user,
      totalCheckins: badge._count.teacherCheckins,
      badgeIssuedAt: badge.issuedAt
    }));

    res.json({
      rankings: formattedRankings
    });

  } catch (error) {
    console.error('Erro ao obter ranking de professores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createTeacherBadge,
  getTeacherBadge,
  getMyTeacherBadge,
  validateTeacherQRCode,
  getTeacherRanking,
};
