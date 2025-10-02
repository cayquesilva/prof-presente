const { prisma } = require("../config/database");

const getTeacherRanking = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // 1. Agrupar os check-ins por professor e contar as ocorrências
    const checkinCounts = await prisma.teacherCheckin.groupBy({
      by: ["teacherBadgeId"],
      _count: {
        id: true, // Contar pelo ID do check-in é eficiente
      },
      orderBy: {
        _count: {
          id: "desc", // Ordenar pelo número de check-ins
        },
      },
      take: parseInt(limit),
    });

    if (checkinCounts.length === 0) {
      return res.json({ rankings: [] });
    }

    // 2. Buscar os detalhes dos professores com base nos IDs dos crachás ranqueados
    const teacherBadgeIds = checkinCounts.map((item) => item.teacherBadgeId);

    const teacherBadges = await prisma.teacherBadge.findMany({
      where: {
        id: {
          in: teacherBadgeIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });

    // 3. Unir os dados de contagem com os detalhes dos professores
    const rankings = checkinCounts
      .map((countItem, index) => {
        const teacherBadge = teacherBadges.find(
          (tb) => tb.id === countItem.teacherBadgeId
        );

        return {
          position: index + 1,
          totalCheckins: countItem._count.id,
          teacher: teacherBadge ? teacherBadge.user : null,
        };
      })
      .filter((item) => item.teacher); // Garante que não haja professores nulos

    res.json({ rankings });
  } catch (error) {
    console.error("Erro ao gerar ranking de professores:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

module.exports = {
  getTeacherRanking,
};
