const { prisma } = require("../config/database");

// Relatório de check-ins de um evento
const getCheckinReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({
        error: "Evento não encontrado",
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
            eventId,
          },
        },
        ...dateFilter,
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { checkinTime: "asc" },
    });

    // Agrupar check-ins por usuário
    const userCheckins = {};
    checkins.forEach((checkin) => {
      const userId = checkin.badge.enrollment.user.id;
      if (!userCheckins[userId]) {
        userCheckins[userId] = {
          user: checkin.badge.enrollment.user,
          checkins: [],
        };
      }
      userCheckins[userId].checkins.push({
        id: checkin.id,
        checkinTime: checkin.checkinTime,
        location: checkin.location,
      });
    });

    // Estatísticas
    const totalEnrollments = await prisma.enrollment.count({
      where: { eventId, status: "APPROVED" },
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
        attendanceRate:
          totalEnrollments > 0
            ? ((uniqueCheckins / totalEnrollments) * 100).toFixed(2)
            : 0,
        averageCheckinsPerUser:
          uniqueCheckins > 0 ? (totalCheckins / uniqueCheckins).toFixed(2) : 0,
      },
      userCheckins: Object.values(userCheckins),
      generatedAt: new Date().toISOString(),
    };

    res.json(report);
  } catch (error) {
    console.error("Erro ao gerar relatório de check-ins:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Relatório de frequência de um evento
const getFrequencyReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // Buscar todas as inscrições aprovadas
    const enrollments = await prisma.enrollment.findMany({
      where: {
        eventId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userBadge: {
              select: {
                _count: {
                  select: {
                    userCheckins: true, // O nome do relacionamento em UserBadge é "userCheckins"
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calcular frequência para cada usuário
    const frequencyData = enrollments.map((enrollment) => {
      const checkinCount = enrollment.user.userBadge?._count?.userCheckins || 0;

      return {
        user: {
          // Montamos o objeto de usuário manualmente
          id: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
        },
        enrollmentDate: enrollment.enrollmentDate,
        checkinCount,
        hasCheckedIn: checkinCount > 0,
        lastCheckin: null, // Será preenchido abaixo se necessário
      };
    });

    // Buscar último check-in para cada usuário
    for (const userData of frequencyData) {
      if (userData.checkinCount > 0) {
        const lastCheckin = await prisma.userCheckin.findFirst({
          where: {
            eventId: eventId,
            userBadge: {
              userId: userData.user.id,
            },
          },
          orderBy: { checkinTime: "desc" },
        });
        userData.lastCheckin = lastCheckin?.checkinTime || null;
      }
    }

    // Estatísticas gerais
    const totalEnrollments = enrollments.length;
    const usersWithCheckin = frequencyData.filter((u) => u.hasCheckedIn).length;
    const usersWithoutCheckin = totalEnrollments - usersWithCheckin;

    // Distribuição de check-ins
    const checkinDistribution = {};
    frequencyData.forEach((userData) => {
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
        attendanceRate:
          totalEnrollments > 0
            ? ((usersWithCheckin / totalEnrollments) * 100).toFixed(2)
            : 0,
      },
      checkinDistribution,
      frequencyData: frequencyData.sort(
        (a, b) => b.checkinCount - a.checkinCount
      ),
      generatedAt: new Date().toISOString(),
    };

    res.json(report);
  } catch (error) {
    console.error("Erro ao gerar relatório de frequência:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
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
        case "month":
          dateFilter.checkinTime = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          };
          break;
        case "year":
          dateFilter.checkinTime = {
            gte: new Date(now.getFullYear(), 0, 1),
          };
          break;
        case "all":
        default:
          // Sem filtro de data
          break;
      }
    }

    // Buscar todos os usuários com crachá universal
    const usersWithBadge = await prisma.userBadge.findMany({
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
    });

    // Calcular check-ins para cada usuário
    const rankingData = [];
    for (const userBadge of usersWithBadge) {
      const checkinCount = await prisma.userCheckin.count({
        where: {
          userBadgeId: userBadge.id,
          ...dateFilter,
        },
      });

      const eventCount = await prisma.enrollment.count({
        where: {
          userId: userBadge.userId,
          status: "APPROVED",
        },
      });

      if (checkinCount > 0) {
        rankingData.push({
          user: userBadge.user,
          checkinCount,
          eventCount,
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
      period: period || "all",
      summary: {
        totalUsers: rankingData.length,
        totalCheckins: rankingData.reduce(
          (sum, item) => sum + item.checkinCount,
          0
        ),
      },
      ranking: rankingWithPosition,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: rankingData.length,
        pages: Math.ceil(rankingData.length / limit),
      },
      generatedAt: new Date().toISOString(),
    };

    res.json(report);
  } catch (error) {
    console.error("Erro ao gerar ranking de frequência:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
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
    const totalCheckins = await prisma.userCheckin.count();
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
      FROM user_checkins
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
              where: { status: "APPROVED" },
            },
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: 5,
    });

    const report = {
      summary: {
        totalUsers,
        totalEvents,
        totalEnrollments,
        totalCheckins,
        totalAwards,
        totalUserAwards,
        averageEnrollmentsPerEvent:
          totalEvents > 0 ? (totalEnrollments / totalEvents).toFixed(2) : 0,
        averageCheckinsPerEnrollment:
          totalEnrollments > 0
            ? (totalCheckins / totalEnrollments).toFixed(2)
            : 0,
      },
      trends: {
        eventsByMonth,
        checkinsByMonth,
      },
      topEvents: topEvents.map((event) => ({
        ...event,
        enrollmentCount: event._count.enrollments,
      })),
      generatedAt: new Date().toISOString(),
    };

    res.json(report);
  } catch (error) {
    console.error("Erro ao gerar relatório do sistema:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// NOVO: Relatório de frequência por Escola (Workplace)
const getWorkplaceReport = async (req, res) => {
  try {
    const { workplaceId } = req.params;
    const { startDate, endDate } = req.query;

    // Verificar se a escola existe
    const workplace = await prisma.workplace.findUnique({
      where: { id: workplaceId },
    });
    if (!workplace) {
      return res
        .status(404)
        .json({ error: "Local de trabalho não encontrado" });
    }

    // Definir filtro de data para os check-ins
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Encontrar todos os usuários daquela escola
    const usersInWorkplace = await prisma.user.findMany({
      where: {
        workplaces: {
          some: {
            id: workplaceId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (usersInWorkplace.length === 0) {
      return res.json({
        message: "Nenhum usuário encontrado para esta localidade.",
        workplace,
        report: [],
      });
    }

    const userIds = usersInWorkplace.map((u) => u.id);

    // Buscar todos os check-ins desses usuários no período
    const checkins = await prisma.checkin.findMany({
      where: {
        badge: {
          enrollment: {
            userId: { in: userIds },
          },
        },
        checkinTime:
          Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      include: {
        badge: {
          include: {
            enrollment: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                event: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    // Agrupar dados para o relatório
    const userFrequency = usersInWorkplace.map((user) => ({
      ...user,
      totalCheckins: 0,
      events: {},
    }));

    const userMap = new Map(userFrequency.map((u) => [u.id, u]));

    checkins.forEach((checkin) => {
      const userId = checkin.badge.enrollment.user.id;
      const eventId = checkin.badge.enrollment.event.id;
      const eventTitle = checkin.badge.enrollment.event.title;

      const userReport = userMap.get(userId);
      if (userReport) {
        userReport.totalCheckins += 1;
        if (!userReport.events[eventId]) {
          userReport.events[eventId] = {
            title: eventTitle,
            checkinCount: 0,
          };
        }
        userReport.events[eventId].checkinCount += 1;
      }
    });

    res.json({
      workplace: {
        id: workplace.id,
        name: workplace.name,
      },
      period: {
        startDate: startDate || "Início",
        endDate: endDate || "Fim",
      },
      summary: {
        totalUsers: usersInWorkplace.length,
        totalCheckins: checkins.length,
      },
      userFrequency: Array.from(userMap.values()).sort(
        (a, b) => b.totalCheckins - a.totalCheckins
      ),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao gerar relatório por escola:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVO: Relatório de frequência com filtros dinâmicos
const getFilteredFrequencyReport = async (req, res) => {
  try {
    const {
      segment,
      city,
      state,
      contractType,
      professionId,
      startDate,
      endDate,
    } = req.query;

    // 1. Construir o filtro para encontrar os usuários
    const userWhereClause = {};
    if (segment) {
      userWhereClause.teachingSegments = { has: segment };
    }
    if (contractType) {
      userWhereClause.contractType = contractType;
    }
    if (professionId) {
      userWhereClause.professionId = professionId;
    }
    if (city || state) {
      userWhereClause.workplaces = {
        some: {
          AND: [
            city ? { city: { equals: city, mode: "insensitive" } } : {},
            state ? { state: { equals: state, mode: "insensitive" } } : {},
          ],
        },
      };
    }

    // 2. Encontrar os usuários que correspondem ao filtro
    const filteredUsers = await prisma.user.findMany({
      where: userWhereClause,
      select: { id: true, name: true, email: true },
    });

    if (filteredUsers.length === 0) {
      return res.json({
        message: "Nenhum usuário encontrado com os filtros aplicados.",
        filters: req.query,
        userFrequency: [],
      });
    }

    const userIds = filteredUsers.map((u) => u.id);

    // 3. Construir o filtro para os check-ins desses usuários
    const checkinDateFilter = {};
    if (startDate) checkinDateFilter.gte = new Date(startDate);
    if (endDate) checkinDateFilter.lte = new Date(endDate);

    const checkins = await prisma.checkin.findMany({
      where: {
        badge: {
          enrollment: {
            userId: { in: userIds },
          },
        },
        checkinTime:
          Object.keys(checkinDateFilter).length > 0
            ? checkinDateFilter
            : undefined,
      },
      include: {
        badge: {
          include: {
            enrollment: {
              include: {
                user: { select: { id: true, name: true } },
                event: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    // 4. Montar o relatório final (similar ao relatório por escola)
    const userFrequencyMap = new Map(
      filteredUsers.map((u) => [u.id, { ...u, totalCheckins: 0, events: {} }])
    );

    checkins.forEach((checkin) => {
      const userId = checkin.badge.enrollment.user.id;
      const eventId = checkin.badge.enrollment.event.id;
      const eventTitle = checkin.badge.enrollment.event.title;
      const userReport = userFrequencyMap.get(userId);

      if (userReport) {
        userReport.totalCheckins += 1;
        if (!userReport.events[eventId]) {
          userReport.events[eventId] = { title: eventTitle, checkinCount: 0 };
        }
        userReport.events[eventId].checkinCount += 1;
      }
    });

    res.json({
      filters: req.query,
      summary: {
        totalUsersFound: filteredUsers.length,
        totalCheckins: checkins.length,
      },
      userFrequency: Array.from(userFrequencyMap.values()).sort(
        (a, b) => b.totalCheckins - a.totalCheckins
      ),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao gerar relatório filtrado:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVO: Relatório de Premiações
const getAwardsReport = async (req, res) => {
  try {
    // 1. Buscar todos os registros de prêmios concedidos, incluindo os dados do prêmio e do usuário
    const userAwards = await prisma.userAward.findMany({
      include: {
        award: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        awardedAt: "desc",
      },
    });

    // 2. Agrupar os resultados por prêmio para facilitar a visualização
    const awardsMap = new Map();
    userAwards.forEach((userAward) => {
      const { award, user, awardedAt } = userAward;

      if (!awardsMap.has(award.id)) {
        awardsMap.set(award.id, {
          ...award,
          recipients: [],
        });
      }

      awardsMap.get(award.id).recipients.push({
        user,
        awardedAt,
      });
    });

    // 3. Preparar o relatório final
    const awardsReport = Array.from(awardsMap.values());
    const totalAwardsGiven = userAwards.length;
    const totalUniqueRecipients = new Set(userAwards.map((ua) => ua.userId))
      .size;

    res.json({
      summary: {
        totalAwardsAvailable: await prisma.award.count(),
        totalAwardsGiven,
        totalUniqueRecipients,
      },
      awardsReport,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de premiações:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVO: Relatório de resumo de um evento (participação, evasão, avaliações)
const getEventSummaryReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1. Buscar o evento e suas inscrições aprovadas
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        enrollments: {
          where: { status: "APPROVED" },
          include: {
            _count: {
              select: {
                courseEvaluation: true, // Conta se há avaliação
              },
            },
            badge: {
              include: {
                _count: {
                  select: { checkins: true }, // Conta os check-ins
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // 2. Calcular estatísticas de participação
    const totalEnrollments = event.enrollments.length;
    let usersWithCheckin = 0;
    event.enrollments.forEach((enrollment) => {
      if (enrollment.badge && enrollment.badge._count.checkins > 0) {
        usersWithCheckin++;
      }
    });
    const usersWithoutCheckin = totalEnrollments - usersWithCheckin; // Evasões
    const attendanceRate =
      totalEnrollments > 0
        ? ((usersWithCheckin / totalEnrollments) * 100).toFixed(2)
        : "0.00";

    // 3. Calcular estatísticas de avaliação
    const evaluations = await prisma.courseEvaluation.findMany({
      where: {
        enrollment: {
          eventId: eventId,
        },
      },
      select: {
        rating: true,
        comment: true,
      },
    });

    const totalEvaluations = evaluations.length;
    const averageRating =
      totalEvaluations > 0
        ? (
            evaluations.reduce((sum, ev) => sum + ev.rating, 0) /
            totalEvaluations
          ).toFixed(2)
        : "0.00";

    const comments = evaluations.map((ev) => ev.comment).filter(Boolean); // Filtra comentários nulos/vazios

    // 4. Montar o relatório final
    const report = {
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      participationSummary: {
        totalEnrollments,
        usersWithCheckin,
        usersWithoutCheckin,
        attendanceRate,
      },
      evaluationSummary: {
        totalEvaluations,
        averageRating,
        comments,
      },
      generatedAt: new Date().toISOString(),
    };

    res.json(report);
  } catch (error) {
    console.error("Erro ao gerar relatório de resumo do evento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = {
  getCheckinReport,
  getFrequencyReport,
  getFrequencyRanking,
  getSystemReport,
  getWorkplaceReport,
  getFilteredFrequencyReport,
  getAwardsReport,
  getEventSummaryReport,
};
