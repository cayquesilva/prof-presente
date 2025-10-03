const { body, validationResult } = require("express-validator");
const { prisma } = require("../config/database");
const sharp = require("sharp");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs/promises");
const path = require("path");

// Validações para evento
const eventValidation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Título deve ter entre 3 e 255 caracteres"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Descrição deve ter pelo menos 10 caracteres"),
  body("startDate").isISO8601().withMessage("Data de início inválida"),
  body("endDate").isISO8601().withMessage("Data de término inválida"),
  body("location")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Local deve ter entre 3 e 255 caracteres"),
  body("maxAttendees")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Número máximo de participantes deve ser um número positivo"),
];

// Listar todos os eventos
const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, upcoming } = req.query;
    const skip = (page - 1) * limit;

    let where = {};

    // Filtro de busca
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro para eventos futuros
    if (upcoming === "true") {
      where.startDate = {
        gte: new Date(),
      };
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        maxAttendees: true,
        imageUrl: true,
        createdAt: true,
        badgeTemplateUrl: true,
        badgeTemplateConfig: true,
        _count: {
          select: {
            enrollments: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { startDate: "asc" },
    });

    const total = await prisma.event.count({ where });

    // Adicionar informações de disponibilidade
    const eventsWithAvailability = events.map((event) => ({
      ...event,
      enrolledCount: event._count.enrollments,
      availableSpots: event.maxAttendees
        ? event.maxAttendees - event._count.enrollments
        : null,
      isFull: event.maxAttendees
        ? event._count.enrollments >= event.maxAttendees
        : false,
    }));

    res.json({
      events: eventsWithAvailability,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Obter evento por ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
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

    // Adicionar informações de disponibilidade
    const eventWithAvailability = {
      ...event,
      enrolledCount: event._count.enrollments,
      availableSpots: event.maxAttendees
        ? event.maxAttendees - event._count.enrollments
        : null,
      isFull: event.maxAttendees
        ? event._count.enrollments >= event.maxAttendees
        : false,
    };

    res.json(eventWithAvailability);
  } catch (error) {
    console.error("Erro ao obter evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Criar evento
const createEvent = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      maxAttendees,
      imageUrl,
    } = req.body;

    // Validar se a data de início é anterior à data de término
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        error: "Data de início deve ser anterior à data de término",
      });
    }

    // Criar evento
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({
      message: "Evento criado com sucesso",
      event,
    });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Atualizar evento
const updateEvent = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      maxAttendees,
      imageUrl,
    } = req.body;

    // Verificar se o evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // Validar se a data de início é anterior à data de término
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        error: "Data de início deve ser anterior à data de término",
      });
    }

    // Preparar dados para atualização
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (location) updateData.location = location;
    if (maxAttendees !== undefined)
      updateData.maxAttendees = maxAttendees ? parseInt(maxAttendees) : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    // Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Evento atualizado com sucesso",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Deletar evento
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // Verificar se há inscrições no evento
    if (event._count.enrollments > 0) {
      return res.status(400).json({
        error: "Não é possível deletar evento com inscrições ativas",
      });
    }

    // Deletar evento
    await prisma.event.delete({
      where: { id },
    });

    res.json({
      message: "Evento deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// NOVA FUNÇÃO: Para fazer upload do modelo de crachá e salvar a configuração
const uploadEventBadgeTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { badgeTemplateConfig } = req.body;

    // Verifica se o evento existe
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Nenhuma imagem de modelo foi enviada" });
    }

    const updateData = {
      badgeTemplateUrl: `/${req.file.path.replace(/\\/g, "/")}`, // Normaliza o caminho para URL
    };

    // Valida e salva a configuração JSON
    if (badgeTemplateConfig) {
      try {
        updateData.badgeTemplateConfig = JSON.parse(badgeTemplateConfig);
      } catch (e) {
        return res.status(400).json({
          error: "Formato de badgeTemplateConfig inválido. Deve ser um JSON.",
        });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Modelo de crachá atualizado com sucesso!",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erro ao fazer upload do modelo de crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVA FUNÇÃO: Para gerar o PDF com todos os crachás dos inscritos
const generatePrintableBadges = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event || !event.badgeTemplateUrl || !event.badgeTemplateConfig) {
      return res.status(404).json({
        error:
          "Evento não encontrado ou não possui um modelo de crachá configurado.",
      });
    }

    // Busca todos os usuários com inscrição aprovada no evento
    const enrollments = await prisma.enrollment.findMany({
      where: { eventId: id, status: "APPROVED" },
      include: {
        user: {
          include: {
            userBadge: true, // Inclui o crachá universal do usuário
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhum participante inscrito para gerar crachás." });
    }

    // Carrega o modelo de crachá
    const templatePath = path.join(process.cwd(), event.badgeTemplateUrl);
    const templateImageBuffer = await fs.readFile(templatePath);

    // Cria um novo documento PDF
    const pdfDoc = await PDFDocument.create();
    const config = event.badgeTemplateConfig;

    // Processa cada participante
    for (const enrollment of enrollments) {
      const user = enrollment.user;
      if (!user.userBadge?.qrCodeUrl) continue; // Pula se o usuário não tiver um QR Code

      // Cria um SVG para o texto (nome do usuário)
      const nameSvg = `
        <svg width="400" height="100">
          <text x="0" y="${
            config.name.fontSize || 24
          }" font-family="sans-serif" font-size="${
        config.name.fontSize || 24
      }" fill="${config.name.color || "#000000"}">
            ${user.name}
          </text>
        </svg>
      `;
      const nameBuffer = Buffer.from(nameSvg);

      // Carrega a imagem do QR Code universal do usuário
      const qrCodePath = path.join(process.cwd(), user.userBadge.qrCodeUrl);
      const qrCodeBuffer = await fs.readFile(qrCodePath);

      // Redimensiona o QR Code conforme a configuração
      const resizedQrCode = await sharp(qrCodeBuffer)
        .resize(config.qrCode.size || 100, config.qrCode.size || 100)
        .toBuffer();

      // Compõe o crachá final: template + nome + QR Code
      const finalBadgeBuffer = await sharp(templateImageBuffer)
        .composite([
          { input: nameBuffer, top: config.name.y, left: config.name.x },
          { input: resizedQrCode, top: config.qrCode.y, left: config.qrCode.x },
        ])
        .jpeg()
        .toBuffer();

      // Adiciona o crachá gerado a uma nova página do PDF
      const badgeImage = await pdfDoc.embedJpg(finalBadgeBuffer);
      const page = pdfDoc.addPage([badgeImage.width, badgeImage.height]);
      page.drawImage(badgeImage, {
        x: 0,
        y: 0,
        width: badgeImage.width,
        height: badgeImage.height,
      });
    }

    // Salva o PDF e envia para o cliente
    const pdfBytes = await pdfDoc.save();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="crachas_${event.title.replace(/\s/g, "_")}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Erro ao gerar crachás para impressão:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  eventValidation,
  uploadEventBadgeTemplate,
  generatePrintableBadges,
};
