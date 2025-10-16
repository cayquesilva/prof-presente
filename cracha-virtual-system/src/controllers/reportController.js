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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { eventId, status: "APPROVED" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (enrollments.length === 0) {
      // Retorna relatório vazio se não houver inscritos
      return res.json({
        event: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
        },
        summary: {
          totalEnrollments: 0,
          usersWithCheckin: 0,
          usersWithoutCheckin: 0,
          attendanceRate: "0.00",
        },
        frequencyData: [],
        generatedAt: new Date().toISOString(),
      });
    }

    const enrolledUserIds = enrollments.map((e) => e.user.id);

    // MUDANÇA: Busca os IDs dos usuários que tiveram PELO MENOS UM check-in no evento.
    const usersWhoCheckedIn = await prisma.userCheckin.findMany({
      where: {
        eventId: eventId,
        userBadge: {
          userId: { in: enrolledUserIds },
        },
      },
      distinct: ["userBadgeId"], // A chave da mudança está aqui!
      select: {
        userBadge: { select: { userId: true } },
      },
    });

    const usersWithCheckinSet = new Set(
      usersWhoCheckedIn.map((c) => c.userBadge.userId)
    );

    // MUDANÇA: Agora, a frequência é simplesmente "presente" ou "ausente".
    const frequencyData = enrollments.map((enrollment) => {
      const hasCheckedIn = usersWithCheckinSet.has(enrollment.user.id);
      return {
        user: enrollment.user,
        enrollmentDate: enrollment.enrollmentDate,
        checkinCount: hasCheckedIn ? 1 : 0, // A contagem agora é binária: 1 para presente, 0 para ausente.
        hasCheckedIn: hasCheckedIn,
      };
    });

    const totalEnrollments = enrollments.length;
    const usersWithCheckin = usersWithCheckinSet.size;
    const usersWithoutCheckin = totalEnrollments - usersWithCheckin;

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

    // MUDANÇA: Agrupa por usuário e evento para obter participações únicas.
    const uniqueParticipations = await prisma.userCheckin.groupBy({
      by: ["userBadgeId", "eventId"],
      where: { ...dateFilter },
    });

    // MUDANÇA: Agrega os resultados para contar eventos únicos por usuário.
    const userEventCounts = uniqueParticipations.reduce((acc, p) => {
      acc[p.userBadgeId] = (acc[p.userBadgeId] || 0) + 1;
      return acc;
    }, {});

    const sortedUsers = Object.entries(userEventCounts)
      .map(([userBadgeId, checkinCount]) => ({ userBadgeId, checkinCount }))
      .sort((a, b) => b.checkinCount - a.checkinCount);

    const paginatedUsers = sortedUsers.slice(skip, skip + parseInt(limit));
    const userBadgeIds = paginatedUsers.map((u) => u.userBadgeId);

    const userBadges = await prisma.userBadge.findMany({
      where: { id: { in: userBadgeIds } },
      include: {
        user: { select: { id: true, name: true, photoUrl: true, email: true } },
      },
    });

    const userBadgesMap = new Map(userBadges.map((ub) => [ub.id, ub.user]));

    const rankingWithPosition = paginatedUsers
      .map((item, index) => {
        const user = userBadgesMap.get(item.userBadgeId);
        return user
          ? {
              position: skip + index + 1,
              user,
              checkinCount: item.checkinCount, // Contagem de eventos únicos
            }
          : null;
      })
      .filter(Boolean);

    const report = {
      period: period || "all",
      summary: {
        totalUsers: sortedUsers.length,
        totalCheckins: sortedUsers.reduce(
          (sum, item) => sum + item.checkinCount,
          0
        ),
      },
      ranking: rankingWithPosition,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sortedUsers.length,
        pages: Math.ceil(sortedUsers.length / limit),
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
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    const totalEnrollments = await prisma.enrollment.count();
    const totalAwards = await prisma.award.count();
    const totalUserAwards = await prisma.userAward.count();

    // MUDANÇA: Conta o total de participações únicas (usuário + evento) em vez de todos os check-ins.
    const uniqueParticipations = await prisma.userCheckin.groupBy({
      by: ["userBadgeId", "eventId"],
    });
    const totalUniqueCheckins = uniqueParticipations.length;

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
        totalCheckins: totalUniqueCheckins, // MUDANÇA: Usando a nova contagem        totalAwards,
        totalUserAwards,
        averageEnrollmentsPerEvent:
          totalEvents > 0 ? (totalEnrollments / totalEvents).toFixed(2) : 0,
        averageCheckinsPerEnrollment:
          totalEnrollments > 0
            ? (totalUniqueCheckins / totalEnrollments).toFixed(2)
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

    const workplace = await prisma.workplace.findUnique({
      where: { id: workplaceId },
    });
    if (!workplace) {
      return res
        .status(404)
        .json({ error: "Local de trabalho não encontrado" });
    }

    // 1. Buscar todos os usuários da escola
    const usersInWorkplace = await prisma.user.findMany({
      where: { workplaces: { some: { id: workplaceId } } },
      select: { id: true, name: true, email: true },
    });

    if (usersInWorkplace.length === 0) {
      return res.json({
        workplace: { id: workplace.id, name: workplace.name },
        period: { startDate: startDate || "N/A", endDate: endDate || "N/A" },
        summary: { totalUsers: 0, totalCheckins: 0 },
        userFrequency: [],
        generatedAt: new Date().toISOString(),
      });
    }
    const userIds = usersInWorkplace.map((u) => u.id);

    // 2. Buscar todos os check-ins relevantes para esses usuários
    const dateFilter = {};
    if (startDate) {
      // Garante que a data de início comece à meia-noite UTC
      dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      // Garante que a data de fim termine no último milissegundo do dia UTC
      dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const uniqueCheckins = await prisma.userCheckin.findMany({
      where: {
        userBadge: { userId: { in: userIds } },
        checkinTime:
          Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      distinct: ["eventId", "userBadgeId"], // A chave da mudança está aqui!
      select: {
        eventId: true,
        userBadge: { select: { userId: true } },
      },
    });

    // 3. Buscar os detalhes dos eventos a partir dos IDs coletados nos check-ins
    const eventIds = [...new Set(checkins.map((c) => c.eventId))];
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, title: true },
    });
    // Criamos um mapa para facilitar a busca do título do evento pelo ID
    const eventsMap = new Map(events.map((e) => [e.id, e.title]));

    // 4. Montar o relatório combinando todas as informações
    const userFrequencyMap = new Map(
      usersInWorkplace.map((u) => [
        u.id,
        { ...u, totalCheckins: 0, events: {} },
      ])
    );

    let totalCheckinsCount = 0;
    uniqueCheckins.forEach((checkin) => {
      totalCheckinsCount++; // Contagem total de participações únicas
      const userId = checkin.userBadge.userId;
      const eventId = checkin.eventId;
      const userReport = userFrequencyMap.get(userId);

      if (userReport) {
        userReport.totalCheckins++; // Incrementa o total de eventos únicos do usuário
        const eventTitle = eventsMap.get(eventId) || "Evento Desconhecido";
        // A lógica de contar check-ins por evento se torna menos relevante, mas pode ser mantida se útil
        if (!userReport.events[eventId]) {
          userReport.events[eventId] = { title: eventTitle, checkinCount: 1 };
        }
      }
    });

    const userFrequencyArray = Array.from(userFrequencyMap.values());

    // Calcular a taxa de participação da unidade
    const usersWithCheckin = userFrequencyArray.filter(
      (u) => u.totalCheckins > 0
    ).length;
    const attendanceRate =
      usersInWorkplace.length > 0
        ? ((usersWithCheckin / usersInWorkplace.length) * 100).toFixed(2)
        : "0.00";

    res.json({
      workplace: { id: workplace.id, name: workplace.name },
      period: {
        startDate: startDate || "Início",
        endDate: endDate || "Fim",
      },
      summary: {
        totalUsers: usersInWorkplace.length,
        totalCheckins: totalCheckinsCount,
        attendanceRate: attendanceRate,
      },
      userFrequency: userFrequencyArray.sort(
        (a, b) => b.totalCheckins - a.totalCheckins
      ),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao gerar relatório por escola:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVA FUNÇÃO: Para buscar opções de filtro, começando com bairros
const getReportFilterOptions = async (req, res) => {
  try {
    const neighborhoods = await prisma.user.findMany({
      where: {
        neighborhood: {
          not: null, // Ignora usuários sem bairro cadastrado
        },
      },
      select: {
        neighborhood: true,
      },
      distinct: ["neighborhood"], // A mágica está aqui: busca apenas valores únicos
      orderBy: {
        neighborhood: "asc",
      },
    });

    res.json({
      // Mapeia o resultado para um array de strings simples: ['Bairro A', 'Bairro B']
      neighborhoods: neighborhoods.map((item) => item.neighborhood),
    });
  } catch (error) {
    console.error("Erro ao buscar opções de filtro:", error);
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
      neighborhood,
      startDate,
      endDate,
    } = req.query;

    // 1. Construir o filtro para encontrar os usuários
    const userWhereClause = {};
    if (segment) userWhereClause.teachingSegments = { has: segment };
    if (contractType) userWhereClause.contractType = contractType;
    if (professionId) userWhereClause.professionId = professionId;
    if (neighborhood)
      userWhereClause.neighborhood = {
        equals: neighborhood,
        mode: "insensitive",
      };
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

    const filteredUsers = await prisma.user.findMany({
      where: userWhereClause,
      select: { id: true, name: true, email: true },
    });

    if (filteredUsers.length === 0) {
      return res.json({
        filters: req.query,
        summary: {
          totalUsersFound: 0,
          totalCheckins: 0,
          usersWithCheckin: 0,
          usersWithoutCheckin: 0,
          attendanceRate: "0.00",
        },
        userFrequency: [],
      });
    }

    const userIds = filteredUsers.map((u) => u.id);

    // 2. Construir o filtro de data e buscar os check-ins
    const checkinDateFilter = {};
    if (startDate)
      checkinDateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) checkinDateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    // MUDANÇA: Busca participações únicas para os usuários filtrados.
    const uniqueCheckins = await prisma.userCheckin.findMany({
      where: {
        userBadge: { userId: { in: userIds } },
        checkinTime:
          Object.keys(checkinDateFilter).length > 0
            ? checkinDateFilter
            : undefined,
      },
      distinct: ["eventId", "userBadgeId"], // A chave da mudança está aqui!
      select: {
        eventId: true,
        userBadge: { select: { userId: true } },
      },
    });

    // 3. Buscar os detalhes dos eventos
    const eventIds = [...new Set(checkins.map((c) => c.eventId))];
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, title: true },
    });
    const eventsMap = new Map(events.map((e) => [e.id, e.title]));

    // 4. Montar o relatório final
    const userFrequencyMap = new Map(
      filteredUsers.map((u) => [u.id, { ...u, totalCheckins: 0, events: {} }])
    );

    uniqueCheckins.forEach((checkin) => {
      const userId = checkin.userBadge.userId;
      const userReport = userFrequencyMap.get(userId);
      if (userReport) {
        userReport.totalCheckins++;
        const eventId = checkin.eventId;
        const eventTitle = eventsMap.get(eventId) || "Evento Desconhecido";
        if (!userReport.events[eventId]) {
          userReport.events[eventId] = { title: eventTitle, checkinCount: 0 };
        }
        userReport.events[eventId].checkinCount++;
      }
    });

    const userFrequencyArray = Array.from(userFrequencyMap.values());
    const usersWithCheckin = userFrequencyArray.filter(
      (u) => u.totalCheckins > 0
    ).length;
    const usersWithoutCheckin = filteredUsers.length - usersWithCheckin;
    const attendanceRate =
      filteredUsers.length > 0
        ? ((usersWithCheckin / filteredUsers.length) * 100).toFixed(2)
        : "0.00";

    res.json({
      filters: req.query,
      summary: {
        totalUsersFound: filteredUsers.length,
        usersWithCheckin,
        usersWithoutCheckin,
        attendanceRate,
        totalCheckins: uniqueCheckins.length,
      },
      userFrequency: userFrequencyArray.sort(
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

    // 1. Buscar o evento para garantir que ele existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // 2. Contar o total de inscrições aprovadas
    const totalEnrollments = await prisma.enrollment.count({
      where: { eventId, status: "APPROVED" },
    });

    // 3. Contar quantos usuários únicos fizeram check-in no evento
    const uniqueCheckinsResult = await prisma.userCheckin.groupBy({
      by: ["userBadgeId"],
      where: { eventId },
    });
    const usersWithCheckin = uniqueCheckinsResult.length;
    const usersWithoutCheckin = totalEnrollments - usersWithCheckin;
    const attendanceRate =
      totalEnrollments > 0
        ? ((usersWithCheckin / totalEnrollments) * 100).toFixed(2)
        : "0.00";

    // 4. Buscar e calcular as estatísticas de avaliação
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

    const comments = evaluations.map((ev) => ev.comment).filter(Boolean);

    // 5. Montar o relatório final
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
  getReportFilterOptions,
};
