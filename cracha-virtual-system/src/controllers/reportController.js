const { prisma } = require('../config/database');

// Relatório de check-ins de um evento
const getCheckinReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    // Construir filtros de data
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.checkinTime = {};
      if (startDate) dateFilter.checkinTime.gte = new Date(startDate);
      if (endDate) dateFilter.checkinTime.lte = new Date(endDate);
    }

    // Buscar check-ins do evento
    const checkins = await prisma.checkin.findMany({
      where: {
        badge: {
          enrollment: {
            eventId
          }
        },
        ...dateFilter
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
                }
              }
            }
          }
        }
      },
      orderBy: { checkinTime: 'asc' }
    });

    // Agrupar check-ins por usuário
    const userCheckins = {};
    checkins.forEach(checkin => {
      const userId = checkin.badge.enrollment.user.id;
      if (!userCheckins[userId]) {
        userCheckins[userId] = {
          user: checkin.badge.enrollment.user,
          checkins: []
        };
      }
      userCheckins[userId].checkins.push({
        id: checkin.id,
        checkinTime: checkin.checkinTime,
        location: checkin.location
      });
    });

    // Estatísticas
    const totalEnrollments = await prisma.enrollment.count({
      where: { eventId, status: 'APPROVED' }
    });

    const uniqueCheckins = Object.keys(userCheckins).length;
    const totalCheckins = checkins.length;

    const report = {
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
      },
      period: {
        startDate: startDate || event.startDate,
        endDate: endDate || event.endDate,
      },
      summary: {
        totalEnrollments,
        uniqueCheckins,
        totalCheckins,
        attendanceRate: totalEnrollments > 0 ? (uniqueCheckins / totalEnrollments * 100).toFixed(2) : 0,
        averageCheckinsPerUser: uniqueCheckins > 0 ? (totalCheckins / uniqueCheckins).toFixed(2) : 0,
      },
      userCheckins: Object.values(userCheckins),
      generatedAt: new Date().toISOString(),
    };

    res.json(report);

  } catch (error) {
    console.error('Erro ao gerar relatório de check-ins:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Relatório de frequência de um evento
const getFrequencyReport = async (req, res) => {
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

    // Buscar todas as inscrições aprovadas
    const enrollments = await prisma.enrollment.findMany({
      where: {
        eventId,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        badge: {
          include: {
            _count: {
              select: {
                checkins: true
              }
            }
          }
        }
      }
    });

    // Calcular frequência para cada usuário
    const frequencyData = enrollments.map(enrollment => {
      const checkinCount = enrollment.badge?._count?.checkins || 0;
      
      return {
        user: enrollment.user,
        enrollmentDate: enrollment.enrollmentDate,
        checkinCount,
        hasCheckedIn: checkinCount > 0,
        lastCheckin: null, // Será preenchido abaixo se necessário
      };
    });

    // Buscar último check-in para cada usuário
    for (const userData of frequencyData) {
      if (userData.checkinCount > 0) {
        const lastCheckin = await prisma.checkin.findFirst({
          where: {
            badge: {
              enrollment: {
                userId: userData.user.id,
                eventId
              }
            }
          },
          orderBy: { checkinTime: 'desc' }
        });
        userData.lastCheckin = lastCheckin?.checkinTime || null;
      }
    }

    // Estatísticas gerais
    const totalEnrollments = enrollments.length;
    const usersWithCheckin = frequencyData.filter(u => u.hasCheckedIn).length;
    const usersWithoutCheckin = totalEnrollments - usersWithCheckin;

    // Distribuição de check-ins
    const checkinDistribution = {};
    frequencyData.forEach(userData => {
      const count = userData.checkinCount;
      if (!checkinDistribution[count]) {
        checkinDistribution[count] = 0;
      }
      checkinDistribution[count]++;
    });

    const report = {
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
      },
      summary: {
        totalEnrollments,
        usersWithCheckin,
        usersWithoutCheckin,
        attendanceRate: totalEnrollments > 0 ? (usersWithCheckin / totalEnrollments * 100).toFixed(2) : 0,
      },
      checkinDistribution,
      frequencyData: frequencyData.sort((a, b) => b.checkinCount - a.checkinCount),
      generatedAt: new Date().toISOString(),
    };

    res.json(report);

  } catch (error) {
    console.error('Erro ao gerar relatório de frequência:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Ranking geral de frequência
const getFrequencyRanking = async (req, res) => {
  try {
    const { page = 1, limit = 10, period } = req.query;
    const skip = (page - 1) * limit;

    // Filtro de período
    let dateFilter = {};
    if (period) {
      const now = new Date();
      switch (period) {
        case 'month':
          dateFilter.checkinTime = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          };
          break;
        case 'year':
          dateFilter.checkinTime = {
            gte: new Date(now.getFullYear(), 0, 1)
          };
          break;
        case 'all':
        default:
          // Sem filtro de data
          break;
      }
    }

    // Buscar usuários com contagem de check-ins
    const userStats = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        photoUrl: true,
        _count: {
          select: {
            enrollments: {
              where: { status: 'APPROVED' }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calcular check-ins para cada usuário
    const rankingData = [];
    for (const user of userStats) {
      const checkinCount = await prisma.checkin.count({
        where: {
          badge: {
            enrollment: {
              userId: user.id
            }
          },
          ...dateFilter
        }
      });

      if (checkinCount > 0) {
        rankingData.push({
          user: {
            id: user.id,
            name: user.name,
            photoUrl: user.photoUrl,
          },
          checkinCount,
          eventCount: user._count.enrollments,
        });
      }
    }

    // Ordenar por número de check-ins
    rankingData.sort((a, b) => b.checkinCount - a.checkinCount);

    // Aplicar paginação
    const paginatedRanking = rankingData.slice(skip, skip + parseInt(limit));

    // Adicionar posição no ranking
    const rankingWithPosition = paginatedRanking.map((item, index) => ({
      position: skip + index + 1,
      ...item,
    }));

    const report = {
      period: period || 'all',
      summary: {
        totalUsers: rankingData.length,
        totalCheckins: rankingData.reduce((sum, item) => sum + item.checkinCount, 0),
      },
      ranking: rankingWithPosition,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: rankingData.length,
        pages: Math.ceil(rankingData.length / limit)
      },
      generatedAt: new Date().toISOString(),
    };

    res.json(report);

  } catch (error) {
    console.error('Erro ao gerar ranking de frequência:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Relatório geral do sistema
const getSystemReport = async (req, res) => {
  try {
    // Estatísticas gerais
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    const totalEnrollments = await prisma.enrollment.count();
    const totalCheckins = await prisma.checkin.count();
    const totalAwards = await prisma.award.count();
    const totalUserAwards = await prisma.userAward.count();

    // Eventos por mês (últimos 12 meses)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const eventsByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', start_date) as month,
        COUNT(*) as count
      FROM events
      WHERE start_date >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', start_date)
      ORDER BY month
    `;

    // Check-ins por mês (últimos 12 meses)
    const checkinsByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', checkin_time) as month,
        COUNT(*) as count
      FROM checkins
      WHERE checkin_time >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', checkin_time)
      ORDER BY month
    `;

    // Top 5 eventos com mais inscrições
    const topEvents = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        startDate: true,
        _count: {
          select: {
            enrollments: {
              where: { status: 'APPROVED' }
            }
          }
        }
      },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      },
      take: 5
    });

    const report = {
      summary: {
        totalUsers,
        totalEvents,
        totalEnrollments,
        totalCheckins,
        totalAwards,
        totalUserAwards,
        averageEnrollmentsPerEvent: totalEvents > 0 ? (totalEnrollments / totalEvents).toFixed(2) : 0,
        averageCheckinsPerEnrollment: totalEnrollments > 0 ? (totalCheckins / totalEnrollments).toFixed(2) : 0,
      },
      trends: {
        eventsByMonth,
        checkinsByMonth,
      },
      topEvents: topEvents.map(event => ({
        ...event,
        enrollmentCount: event._count.enrollments,
      })),
      generatedAt: new Date().toISOString(),
    };

    res.json(report);

  } catch (error) {
    console.error('Erro ao gerar relatório do sistema:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getCheckinReport,
  getFrequencyReport,
  getFrequencyRanking,
  getSystemReport,
};

