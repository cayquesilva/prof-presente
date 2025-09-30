const { prisma } = require("../config/database");
const { generateQRCode } = require("../utils/qrcode");

// Inscrever usuário em evento
const enrollInEvent = async (req, res) => {
  try {
    // Suporta tanto via params quanto via body
    const eventId = req.params.eventId || req.body.eventId;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({
        error: "eventId é obrigatório",
      });
    }

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // Verificar se o evento ainda não começou
    if (new Date() > event.startDate) {
      return res.status(400).json({
        error: "Não é possível se inscrever em evento que já começou",
      });
    }

    // Verificar se há vagas disponíveis
    if (event.maxAttendees && event._count.enrollments >= event.maxAttendees) {
      return res.status(400).json({
        error: "Evento lotado. Não há mais vagas disponíveis.",
      });
    }

    // Verificar se o usuário já está inscrito
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        error: "Usuário já está inscrito neste evento",
        enrollment: existingEnrollment,
      });
    }

    // Criar inscrição
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        eventId,
        status: "APPROVED", // Por padrão, aprovamos automaticamente
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    // Gerar crachá virtual automaticamente
    await generateBadgeForEnrollment(enrollment.id);

    res.status(201).json({
      message: "Inscrição realizada com sucesso",
      enrollment,
    });
  } catch (error) {
    console.error("Erro ao inscrever usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Função auxiliar para gerar crachá
const generateBadgeForEnrollment = async (enrollmentId) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        event: true,
      },
    });

    if (!enrollment) {
      throw new Error("Inscrição não encontrada");
    }

    // Dados para o QR code (JSON com informações da inscrição)
    const qrData = JSON.stringify({
      enrollmentId: enrollment.id,
      userId: enrollment.user.id,
      eventId: enrollment.event.id,
      timestamp: new Date().toISOString(),
    });

    // Gerar QR code
    const qrCodeFilename = `badge_${enrollment.id}`;
    const qrCodePath = await generateQRCode(qrData, qrCodeFilename);
    const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;

    // URL da imagem do crachá (será gerada posteriormente)
    const badgeImageUrl = `/api/badges/${enrollment.id}/image`;

    // Criar registro do crachá
    const badge = await prisma.badge.create({
      data: {
        enrollmentId: enrollment.id,
        qrCodeUrl,
        badgeImageUrl,
        validUntil: enrollment.event.endDate,
      },
    });

    return badge;
  } catch (error) {
    console.error("Erro ao gerar crachá:", error);
    throw error;
  }
};

// Listar inscrições do usuário
const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            imageUrl: true,
          },
        },
        badge: {
          select: {
            id: true,
            qrCodeUrl: true,
            badgeImageUrl: true,
            issuedAt: true,
          },
        },
        courseEvaluation: {
          select: { id: true },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { enrollmentDate: "desc" },
    });

    const total = await prisma.enrollment.count({ where });

    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar inscrições do usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Listar inscrições de um evento (admin)
const getEventEnrollments = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { eventId };
    if (status) {
      where.status = status;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
          },
        },
        badge: {
          select: {
            id: true,
            issuedAt: true,
          },
        },
        _count: {
          select: {
            badge: {
              select: {
                checkins: true,
              },
            },
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { enrollmentDate: "desc" },
    });

    const total = await prisma.enrollment.count({ where });

    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar inscrições do evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Cancelar inscrição
const cancelEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    // Buscar inscrição
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        event: true,
        user: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        error: "Inscrição não encontrada",
      });
    }

    // Verificar se o usuário pode cancelar (próprio usuário ou admin)
    if (req.user.role !== "ADMIN" && enrollment.userId !== userId) {
      return res.status(403).json({
        error: "Você não tem permissão para cancelar esta inscrição",
      });
    }

    // Verificar se o evento ainda não começou
    if (new Date() > enrollment.event.startDate) {
      return res.status(400).json({
        error: "Não é possível cancelar inscrição de evento que já começou",
      });
    }

    // Atualizar status da inscrição
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "CANCELLED" },
    });

    res.json({
      message: "Inscrição cancelada com sucesso",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Atualizar status da inscrição (admin)
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!["PENDING", "APPROVED", "CANCELLED"].includes(status)) {
      return res.status(400).json({
        error: "Status inválido",
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return res.status(404).json({
        error: "Inscrição não encontrada",
      });
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json({
      message: "Status da inscrição atualizado com sucesso",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Erro ao atualizar status da inscrição:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Listar inscrições do usuário logado (NOVA FUNÇÃO)
const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user.id; // Pega o ID do usuário logado pelo token

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            imageUrl: true,
          },
        },
        badge: {
          select: {
            id: true,
            qrCodeUrl: true,
            badgeImageUrl: true,
            issuedAt: true,
          },
        },
        // Adicionei a relação com evaluation para o botão 'Avaliar' funcionar corretamente
        courseEvaluation: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { enrollmentDate: "desc" },
    });

    // Retorna a resposta em um formato consistente com o que o frontend espera
    res.json({
      data: enrollments,
    });
  } catch (error) {
    console.error("Erro ao listar minhas inscrições:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

module.exports = {
  enrollInEvent,
  getUserEnrollments,
  getMyEnrollments,
  getEventEnrollments,
  cancelEnrollment,
  updateEnrollmentStatus,
};
