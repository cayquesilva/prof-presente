const { prisma } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const { generateQRCode } = require('../utils/qrcode');

// Obter crachá por ID da inscrição
const getBadgeByEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const badge = await prisma.badge.findUnique({
      where: { enrollmentId },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                photoUrl: true,
              }
            },
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                location: true,
                imageUrl: true,
              }
            }
          }
        }
      }
    });

    if (!badge) {
      return res.status(404).json({
        error: 'Crachá não encontrado'
      });
    }

    // Verificar se o usuário pode acessar este crachá
    if (req.user.role !== 'ADMIN' && badge.enrollment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você não tem permissão para acessar este crachá'
      });
    }

    res.json(badge);

  } catch (error) {
    console.error('Erro ao obter crachá:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Gerar imagem do crachá virtual
const generateBadgeImage = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const badge = await prisma.badge.findUnique({
      where: { enrollmentId },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                photoUrl: true,
              }
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                location: true,
              }
            }
          }
        }
      }
    });

    if (!badge) {
      return res.status(404).json({
        error: 'Crachá não encontrado'
      });
    }

    // Verificar se o usuário pode acessar este crachá
    if (req.user.role !== 'ADMIN' && badge.enrollment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você não tem permissão para acessar este crachá'
      });
    }

    // Por enquanto, retornamos dados JSON do crachá
    // Em uma implementação completa, aqui geraria uma imagem PNG/JPG
    const badgeData = {
      id: badge.id,
      user: {
        name: badge.enrollment.user.name,
        email: badge.enrollment.user.email,
        photo: badge.enrollment.user.photoUrl,
      },
      event: {
        title: badge.enrollment.event.title,
        location: badge.enrollment.event.location,
        date: badge.enrollment.event.startDate,
      },
      qrCode: badge.qrCodeUrl,
      issuedAt: badge.issuedAt,
      validUntil: badge.validUntil,
    };

    res.json({
      message: 'Dados do crachá virtual',
      badge: badgeData
    });

  } catch (error) {
    console.error('Erro ao gerar imagem do crachá:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Servir arquivo do QR code
const getQRCode = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const badge = await prisma.badge.findUnique({
      where: { enrollmentId },
      include: {
        enrollment: {
          select: {
            userId: true,
          }
        }
      }
    });

    if (!badge) {
      return res.status(404).json({
        error: 'Crachá não encontrado'
      });
    }

    // Verificar se o usuário pode acessar este QR code
    if (req.user.role !== 'ADMIN' && badge.enrollment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você não tem permissão para acessar este QR code'
      });
    }

    // Construir caminho do arquivo QR code
    const qrCodePath = path.join(process.cwd(), 'uploads', 'qrcodes', `badge_${badge.enrollmentId}.png`);

    try {
      // Verificar se o arquivo existe
      await fs.access(qrCodePath);
      
      // Servir o arquivo
      res.sendFile(qrCodePath);
    } catch (fileError) {
      return res.status(404).json({
        error: 'Arquivo QR code não encontrado'
      });
    }

  } catch (error) {
    console.error('Erro ao obter QR code:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Validar QR code (para check-in)
const validateQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        error: 'Dados do QR code são obrigatórios'
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({
        error: 'Formato de QR code inválido'
      });
    }

    const { enrollmentId, userId, eventId } = parsedData;

    if (!enrollmentId || !userId || !eventId) {
      return res.status(400).json({
        error: 'QR code incompleto'
      });
    }

    // Buscar crachá e validar dados
    const badge = await prisma.badge.findUnique({
      where: { enrollmentId },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                location: true,
              }
            }
          }
        }
      }
    });

    if (!badge) {
      return res.status(404).json({
        error: 'Crachá não encontrado',
        valid: false
      });
    }

    // Validar se os dados do QR code correspondem ao crachá
    if (badge.enrollment.userId !== userId || badge.enrollment.eventId !== eventId) {
      return res.status(400).json({
        error: 'QR code inválido',
        valid: false
      });
    }

    // Verificar se o crachá ainda é válido
    if (badge.validUntil && new Date() > badge.validUntil) {
      return res.status(400).json({
        error: 'Crachá expirado',
        valid: false
      });
    }

    // Verificar se a inscrição está aprovada
    if (badge.enrollment.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Inscrição não aprovada',
        valid: false
      });
    }

    res.json({
      message: 'QR code válido',
      valid: true,
      badge: {
        id: badge.id,
        user: badge.enrollment.user,
        event: badge.enrollment.event,
        enrollmentId: badge.enrollmentId,
      }
    });

  } catch (error) {
    console.error('Erro ao validar QR code:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar todos os crachás (admin)
const getAllBadges = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (eventId) {
      where.enrollment = {
        eventId
      };
    }

    const badges = await prisma.badge.findMany({
      where,
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                location: true,
              }
            }
          }
        },
        _count: {
          select: {
            checkins: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { issuedAt: 'desc' }
    });

    const total = await prisma.badge.count({ where });

    res.json({
      badges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar crachás:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// NOVA FUNÇÃO: Listar crachás do usuário logado
const getMyBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const badges = await prisma.badge.findMany({
      where: {
        enrollment: {
          userId: userId,
          // Opcional: mostrar apenas de inscrições aprovadas
          status: 'APPROVED',
        }
      },
      include: {
        enrollment: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            event: {
              select: { id: true, title: true, description: true, startDate: true, location: true }
            }
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    // Retornar no formato { data: [...] } que o frontend espera
    res.json({ data: badges });

  } catch (error) {
    console.error('Erro ao listar meus crachás:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// NOVA FUNÇÃO: Lidar com o download da imagem do crachá
const downloadBadgeImage = async (req, res) => {
  // AVISO: A geração de uma imagem dinâmica (PNG/JPG) no backend
  // é uma tarefa complexa que requer bibliotecas de manipulação de imagem
  // como 'node-canvas' ou 'puppeteer'.
  // Este é um placeholder que retorna um erro "Não Implementado".
  
  try {
    const { badgeId } = req.params;

    // TODO: Adicionar lógica para buscar os dados do crachá pelo badgeId

    console.log(`Tentativa de download do crachá ID: ${badgeId}`);
    
    // Retorna o status 501 - Not Implemented (Não Implementado)
    res.status(501).json({
      error: 'A funcionalidade de gerar e baixar a imagem do crachá ainda não foi implementada no servidor.'
    });

  } catch (error) {
    console.error('Erro no placeholder de download do crachá:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


const regenerateQRCode = async (req, res) => {
  try {
    const { badgeId } = req.params;

    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        enrollment: {
          include: {
            user: true,
            event: true,
          }
        }
      }
    });

    if (!badge) {
      return res.status(404).json({ error: 'Crachá não encontrado' });
    }

    const qrData = JSON.stringify({
      enrollmentId: badge.enrollment.id,
      userId: badge.enrollment.user.id,
      eventId: badge.enrollment.event.id,
      timestamp: new Date().toISOString(),
    });

    const qrCodeFilename = `badge_${badge.enrollmentId}`;
    await generateQRCode(qrData, qrCodeFilename);

    res.json({
      message: 'QR Code regenerado com sucesso',
      qrCodeUrl: badge.qrCodeUrl
    });

  } catch (error) {
    console.error('Erro ao regenerar QR code:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getBadgeByEnrollment,
  generateBadgeImage,
  getQRCode,
  validateQRCode,
  getAllBadges,
  getMyBadges,
  downloadBadgeImage,
  regenerateQRCode,
};

