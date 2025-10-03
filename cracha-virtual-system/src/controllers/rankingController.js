// NOVO: Este controller foi criado para centralizar a lógica de ranking.
const { prisma } = require("../config/database");

// Função para gerar o ranking unificado de usuários com base nos check-ins.
const getCheckinRanking = async (req, res) => {
  try {
    const { limit = 20 } = req.query; // Padrão de 20 para o ranking.

    // 1. Agrupa os check-ins por usuário (via userBadgeId) e conta as ocorrências.
    const checkinCounts = await prisma.userCheckin.groupBy({
      by: ["userBadgeId"],
      _count: {
        id: true, // Contar pelo ID do check-in é eficiente.
      },
      orderBy: {
        _count: {
          id: "desc", // Ordenar pelo número de check-ins.
        },
      },
      take: parseInt(limit),
    });

    if (checkinCounts.length === 0) {
      return res.json({ rankings: [] });
    }

    // 2. Extrai os IDs dos crachás dos usuários ranqueados.
    const userBadgeIds = checkinCounts.map((item) => item.userBadgeId);

    // 3. Busca os detalhes dos crachás e dos usuários correspondentes.
    const userBadges = await prisma.userBadge.findMany({
      where: {
        id: {
          in: userBadgeIds,
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

    // 4. Une os dados da contagem com os detalhes dos usuários para formar o ranking final.
    const rankings = checkinCounts
      .map((countItem, index) => {
        const userBadge = userBadges.find(
          (ub) => ub.id === countItem.userBadgeId
        );

        // Retorna null se o usuário não for encontrado (caso raro de inconsistência de dados).
        if (!userBadge || !userBadge.user) {
          return null;
        }

        return {
          position: index + 1,
          totalCheckins: countItem._count.id,
          user: userBadge.user,
        };
      })
      .filter(item => item !== null); // Remove qualquer item nulo da lista.

    res.json({ rankings });

  } catch (error) {
    console.error("Erro ao gerar ranking de check-ins:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

module.exports = {
  getCheckinRanking,
};