// NOVO: Este arquivo substitui o userBadgeController.js, teacherBadgeController.js e badgeController.js.
// Ele gerencia apenas o crachá universal do usuário.
const { prisma } = require("../config/database");
const { generateQRCode } = require("../utils/qrcode");

// Função auxiliar para gerar um código legível para o crachá.
const generateBadgeCode = (userName) => {
  const names = userName.trim().split(" ");
  const firstName = names[0].toUpperCase();
  const lastName =
    names.length > 1 ? names[names.length - 1].toUpperCase() : "";
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);

  if (lastName) {
    return `${firstName}-${lastName}-${randomNumbers}`;
  }
  return `${firstName}-${randomNumbers}`;
};

// Criar crachá universal do usuário. Geralmente chamado por um administrador.
const createUserBadge = async (req, res) => {
  try {
    const { userId } = req.params;

    const existingBadge = await prisma.userBadge.findUnique({
      where: { userId },
    });

    if (existingBadge) {
      return res.status(409).json({
        error: "Usuário já possui um crachá",
        badge: existingBadge,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    let badgeCode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      badgeCode = generateBadgeCode(user.name);
      const existing = await prisma.userBadge.findUnique({
        where: { badgeCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        error: "Não foi possível gerar um código único para o crachá",
      });
    }

    const qrData = JSON.stringify({
      userId: user.id,
      badgeCode,
      badgeType: "user", // Mantemos um tipo para consistência, mesmo sendo o único.
      timestamp: new Date().toISOString(),
    });

    const qrCodeFilename = `user_badge_${user.id}`;
    await generateQRCode(qrData, qrCodeFilename);
    const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;
    const badgeImageUrl = `/api/badges/${user.id}/image`; // Rota ajustada

    const userBadge = await prisma.userBadge.create({
      data: {
        userId: user.id,
        badgeCode,
        qrCodeUrl,
        badgeImageUrl,
      },
    });

    res.status(201).json({
      message: "Crachá universal criado com sucesso",
      badge: userBadge,
    });
  } catch (error) {
    console.error("Erro ao criar crachá universal:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter crachá universal de um usuário específico.
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
          },
        },
        _count: {
          select: {
            userCheckins: true,
          },
        },
      },
    });

    if (!userBadge) {
      return res.status(404).json({ error: "Crachá não encontrado" });
    }

    // ALTERAÇÃO: Simplificada a verificação de permissão.
    // Antes, verificava se era o próprio usuário ou admin.
    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return res
        .status(403)
        .json({ error: "Você não tem permissão para acessar este crachá" });
    }

    res.json(userBadge);
  } catch (error) {
    console.error("Erro ao obter crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter o crachá do próprio usuário logado. Cria um automaticamente se não existir.
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
          },
        },
        _count: {
          select: {
            userCheckins: true,
          },
        },
      },
    });

    // Se o crachá não existir, cria um na hora.
    if (!userBadge) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      let badgeCode;
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        badgeCode = generateBadgeCode(user.name);
        const existing = await prisma.userBadge.findUnique({
          where: { badgeCode },
        });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({
          error: "Não foi possível gerar um código único para o crachá",
        });
      }

      const qrData = JSON.stringify({
        userId: user.id,
        badgeCode,
        badgeType: "user",
        timestamp: new Date().toISOString(),
      });

      const qrCodeFilename = `user_badge_${user.id}`;
      await generateQRCode(qrData, qrCodeFilename);
      const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;
      const badgeImageUrl = `/api/badges/${user.id}/image`; // Rota ajustada

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
            },
          },
          _count: {
            select: {
              userCheckins: true,
            },
          },
        },
      });
    }

    res.json(userBadge);
  } catch (error) {
    console.error("Erro ao obter meu crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Validar crachá universal (por QR code ou código manual).
const validateUserBadge = async (req, res) => {
  try {
    const { badgeCode, qrData } = req.body;
    let userBadge;

    if (qrData) {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (parseError) {
        return res.status(400).json({ error: "Formato de QR code inválido" });
      }

      // ALTERAÇÃO: Simplificado para validar apenas crachás de usuário.
      const { userId, badgeType } = parsedData;
      if (!userId || badgeType !== "user") {
        return res
          .status(400)
          .json({ error: "QR code inválido ou não é um crachá de usuário" });
      }

      userBadge = await prisma.userBadge.findUnique({
        where: { userId },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    } else if (badgeCode) {
      userBadge = await prisma.userBadge.findUnique({
        where: { badgeCode: badgeCode.toUpperCase() },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    } else {
      return res
        .status(400)
        .json({ error: "Código ou QR code são obrigatórios" });
    }

    if (!userBadge) {
      return res
        .status(404)
        .json({ error: "Crachá não encontrado", valid: false });
    }

    res.json({
      message: "Crachá válido",
      valid: true,
      badge: {
        id: userBadge.id,
        badgeCode: userBadge.badgeCode,
        user: userBadge.user,
        type: "user",
      },
    });
  } catch (error) {
    console.error("Erro ao validar crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Buscar usuários por nome para autocomplete na tela de check-in.
const searchUsersByName = async (req, res) => {
  try {
    const { query, eventId } = req.query;

    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    const where = {
      name: { contains: query, mode: "insensitive" },
    };

    // Se um eventId for fornecido, filtramos apenas usuários inscritos nele
    if (eventId) {
      where.enrollments = {
        some: {
          eventId,
          status: "APPROVED",
        },
      };
    }

    // Consulta única e otimizada que busca o usuário e seu crachá de uma vez
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
        userBadge: {
          // Inclui o crachá relacionado diretamente na consulta
          select: {
            badgeCode: true,
          },
        },
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    // Formata o resultado para o frontend
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      badgeCode: user.userBadge?.badgeCode || null, // Acessa o código do crachá
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Gerar crachás para todos os usuários existentes que não possuem um.
const generateMissingBadges = async (req, res) => {
  try {
    // 1. Encontra todos os usuários que NÃO possuem um UserBadge vinculado.
    const usersWithoutBadge = await prisma.user.findMany({
      where: {
        userBadge: null, // Filtra usuários onde a relação com UserBadge é nula
      },
    });

    if (usersWithoutBadge.length === 0) {
      return res.json({ message: "Todos os usuários já possuem crachás." });
    }

    // 2. Responde imediatamente ao admin, informando que o processo começou.
    res.status(202).json({
      message: `Processo iniciado. Criando crachás para ${usersWithoutBadge.length} usuários em segundo plano.`,
    });

    // 3. Executa a criação dos crachás em segundo plano para não travar a API.
    (async () => {
      console.log(
        `Iniciando a criação de ${usersWithoutBadge.length} crachás...`
      );
      for (const user of usersWithoutBadge) {
        try {
          // Reutiliza a mesma lógica de criação de crachá
          let badgeCode;
          let isUnique = false;
          while (!isUnique) {
            badgeCode = generateBadgeCode(user.name);
            const existing = await prisma.userBadge.findUnique({
              where: { badgeCode },
            });
            if (!existing) isUnique = true;
          }

          const qrData = JSON.stringify({
            userId: user.id,
            badgeCode,
            badgeType: "user",
          });
          const qrCodeFilename = `user_badge_${user.id}`;
          await generateQRCode(qrData, qrCodeFilename);
          const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;
          const badgeImageUrl = `/api/badges/${user.id}/image`;

          await prisma.userBadge.create({
            data: {
              userId: user.id,
              badgeCode,
              qrCodeUrl,
              badgeImageUrl,
            },
          });
          console.log(
            `Crachá criado para o usuário: ${user.name} (${user.id})`
          );
        } catch (error) {
          console.error(
            `Falha ao criar crachá para o usuário ${user.id}:`,
            error
          );
        }
      }
      console.log("Criação de crachás em lote finalizada.");
    })();
  } catch (error) {
    console.error("Erro ao iniciar a geração de crachás faltantes:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor ao iniciar o processo." });
  }
};

// Obter a contagem de usuários que não possuem um crachá universal.
const getMissingBadgesCount = async (req, res) => {
  try {
    const count = await prisma.user.count({
      where: {
        userBadge: null,
      },
    });
    res.json({ count });
  } catch (error) {
    console.error("Erro ao contar usuários sem crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

module.exports = {
  createUserBadge,
  getUserBadge,
  getMyUserBadge,
  validateUserBadge,
  searchUsersByName,
  generateMissingBadges,
  getMissingBadgesCount,
};
