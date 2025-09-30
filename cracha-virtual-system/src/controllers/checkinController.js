const { prisma } = require('../config/database');

// Realizar check-in
const performCheckin = async (req, res) => {
  try {
    const { qrCodeValue, location } = req.body;

    if (!qrCodeValue) {
      return res.status(400).json({
        error: 'Valor do QR code é obrigatório'
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrCodeValue);
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

    // Buscar crachá e validar
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
        error: 'Crachá não encontrado'
      });
    }

    // Validar dados do QR code
    if (badge.enrollment.userId !== userId || badge.enrollment.eventId !== eventId) {
      return res.status(400).json({
        error: 'QR code inválido'
      });
    }

    // Verificar se o crachá ainda é válido
    if (badge.validUntil && new Date() > badge.validUntil) {
      return res.status(400).json({
        error: 'Crachá expirado'
      });
    }

    // Verificar se a inscrição está aprovada
    if (badge.enrollment.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Inscrição não aprovada'
      });
    }

    // Verificar se o evento está acontecendo
    const now = new Date();
    if (now < badge.enrollment.event.startDate) {
      return res.status(400).json({
        error: 'Evento ainda não começou'
      });
    }

    if (now > badge.enrollment.event.endDate) {
      return res.status(400).json({
        error: 'Evento já terminou'
      });
    }

    // Verificar se já fez check-in recente (últimos 5 minutos)
    const recentCheckin = await prisma.checkin.findFirst({
      where: {
        badgeId: badge.id,
        checkinTime: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos atrás
        }
      }
    });

    if (recentCheckin) {
      return res.status(400).json({
        error: 'Check-in já realizado recentemente',
        lastCheckin: recentCheckin
      });
    }

    // Realizar check-in
    const checkin = await prisma.checkin.create({
      data: {
        badgeId: badge.id,
        location: location || badge.enrollment.event.location,
      },
      include: {
        badge: {
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
                    location: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Check-in realizado com sucesso',
      checkin
    });

  } catch (error) {
    console.error('Erro ao realizar check-in:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar check-ins de um evento (admin)
const getEventCheckins = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, date } = req.query;
    const skip = (page - 1) * limit;

    let where = {
      badge: {
        enrollment: {
          eventId
        }
      }
    };

    // Filtro por data específica
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.checkinTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const checkins = await prisma.checkin.findMany({
      where,
      include: {
        badge: {
          include: {
            enrollment: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { checkinTime: 'desc' }
    });

    const total = await prisma.checkin.count({ where });

    res.json({
      checkins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar check-ins do evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar check-ins de um usuário
const getUserCheckins = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const checkins = await prisma.checkin.findMany({
      where: {
        badge: {
          enrollment: {
            userId
          }
        }
      },
      include: {
        badge: {
          include: {
            enrollment: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    location: true,
                    startDate: true,
                    endDate: true,
                  }
                }
              }
            }
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { checkinTime: 'desc' }
    });

    const total = await prisma.checkin.count({
      where: {
        badge: {
          enrollment: {
            userId
          }
        }
      }
    });

    res.json({
      checkins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar check-ins do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Obter estatísticas de check-in de um evento
const getEventCheckinStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    // Total de inscrições aprovadas
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        eventId,
        status: 'APPROVED'
      }
    });

    // Total de check-ins únicos (usuários únicos que fizeram check-in)
    const uniqueCheckins = await prisma.checkin.count({
      where: {
        badge: {
          enrollment: {
            eventId
          }
        }
      },
      distinct: ['badgeId']
    });

    // Total de check-ins (incluindo múltiplos check-ins do mesmo usuário)
    const totalCheckins = await prisma.checkin.count({
      where: {
        badge: {
          enrollment: {
            eventId
          }
        }
      }
    });

    // Check-ins por dia
    const checkinsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(c.checkin_time) as date,
        COUNT(DISTINCT c.badge_id) as unique_checkins,
        COUNT(c.id) as total_checkins
      FROM checkins c
      JOIN badges b ON c.badge_id = b.id
      JOIN enrollments e ON b.enrollment_id = e.id
      WHERE e.event_id = ${eventId}
      GROUP BY DATE(c.checkin_time)
      ORDER BY date
    `;

    const stats = {
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      totalEnrollments,
      uniqueCheckins,
      totalCheckins,
      attendanceRate: totalEnrollments > 0 ? (uniqueCheckins / totalEnrollments * 100).toFixed(2) : 0,
      checkinsByDay
    };

    res.json(stats);

  } catch (error) {
    console.error('Erro ao obter estatísticas de check-in:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  performCheckin,
  getEventCheckins,
  getUserCheckins,
  getEventCheckinStats,
};

