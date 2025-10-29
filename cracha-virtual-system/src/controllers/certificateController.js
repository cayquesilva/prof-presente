const { prisma } = require("../config/database");
const { PDFDocument, rgb } = require("pdf-lib"); // Biblioteca para manipular PDF
const fs = require("fs/promises");
const path = require("path");

// Função principal para gerar o certificado
const generateCertificate = async (req, res) => {
  try {
    const { parentEventId, userId } = req.params;

    // 1. Validar dados
    const parentEvent = await prisma.event.findUnique({
      where: { id: parentEventId },
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!parentEvent || !user) {
      return res
        .status(404)
        .json({ error: "Evento ou usuário não encontrado." });
    }
    if (!parentEvent.certificateTemplateUrl) {
      return res.status(400).json({
        error: "Este evento não possui um modelo de certificado configurado.",
      });
    }

    // 2. Encontrar todos os eventos-filho
    const childEvents = await prisma.event.findMany({
      where: { parentId: parentEventId },
    });
    const eventIds = [parentEventId, ...childEvents.map((e) => e.id)];

    // 3. Encontrar todos os check-ins do usuário nesses eventos
    const checkins = await prisma.userCheckin.findMany({
      where: {
        eventId: { in: eventIds },
        userBadge: { userId: userId },
      },
      include: { event: true },
    });

    if (checkins.length === 0) {
      return res
        .status(400)
        .json({ error: "Usuário não participou de nenhum evento do grupo." });
    }

    // 4. Calcular a soma das horas
    let totalMilliseconds = 0;
    const attendedEvents = new Set(); // Para não somar o mesmo evento várias vezes
    checkins.forEach((checkin) => {
      if (!attendedEvents.has(checkin.eventId)) {
        const duration =
          new Date(checkin.event.endDate) - new Date(checkin.event.startDate);
        totalMilliseconds += duration;
        attendedEvents.add(checkin.eventId);
      }
    });
    const totalHours = (totalMilliseconds / (1000 * 60 * 60)).toFixed(1);

    // 5. Gerar o PDF (lógica similar à do crachá)
    // 1. Carrega a imagem de fundo (template)
    const templatePath = path.join(
      process.cwd(),
      parentEvent.certificateTemplateUrl
    );
    const templateImageBuffer = await fs.readFile(templatePath);

    const config = parentEvent.certificateTemplateConfig;

    // 2. Cria SVGs para os textos
    const nameSvg = `<svg width="800" height="100"><text x="0" y="${
      config.name.fontSize || 24
    }" font-family="DejaVu Sans" font-size="${
      config.name.fontSize || 24
    }" fill="${config.name.color || "#000000"}">${user.name}</text></svg>`;
    const hoursSvg = `<svg width="400" height="100"><text x="0" y="${
      config.hours.fontSize || 18
    }" font-family="DejaVu Sans" font-size="${
      config.hours.fontSize || 18
    }" fill="${
      config.hours.color || "#333333"
    }">${totalHours} horas</text></svg>`;

    // 3. Compõe a imagem final com os textos
    const finalCertificateBuffer = await sharp(templateImageBuffer)
      .composite([
        {
          input: Buffer.from(nameSvg),
          top: config.name.y,
          left: config.name.x,
        },
        {
          input: Buffer.from(hoursSvg),
          top: config.hours.y,
          left: config.hours.x,
        },
      ])
      .jpeg() // ou .png()
      .toBuffer();

    // 4. Cria um novo PDF e insere a imagem gerada
    const pdfDoc = await PDFDocument.create();
    const certificateImage = await pdfDoc.embedJpg(finalCertificateBuffer); // ou embedPng
    const page = pdfDoc.addPage([
      certificateImage.width,
      certificateImage.height,
    ]);
    page.drawImage(certificateImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificado_${user.name.replace(/\s+/g, "_")}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

module.exports = { generateCertificate };
