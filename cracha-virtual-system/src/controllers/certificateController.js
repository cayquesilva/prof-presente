const { prisma } = require("../config/database");
const { PDFDocument, rgb } = require("pdf-lib"); // Biblioteca para manipular PDF
const fetch = require("node-fetch"); // Para baixar o template

// Função principal para gerar o certificado
const generateCertificate = async (req, res) => {
    try {
        const { parentEventId, userId } = req.params;

        // 1. Validar dados
        const parentEvent = await prisma.event.findUnique({ where: { id: parentEventId } });
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!parentEvent || !user) {
            return res.status(404).json({ error: "Evento ou usuário não encontrado." });
        }
        if (!parentEvent.certificateTemplateUrl) {
            return res.status(400).json({ error: "Este evento não possui um modelo de certificado configurado." });
        }

        // 2. Encontrar todos os eventos-filho
        const childEvents = await prisma.event.findMany({ where: { parentId: parentEventId } });
        const eventIds = [parentEventId, ...childEvents.map(e => e.id)];

        // 3. Encontrar todos os check-ins do usuário nesses eventos
        const checkins = await prisma.userCheckin.findMany({
            where: {
                eventId: { in: eventIds },
                userBadge: { userId: userId },
            },
            include: { event: true },
        });

        if (checkins.length === 0) {
            return res.status(400).json({ error: "Usuário não participou de nenhum evento do grupo." });
        }
        
        // 4. Calcular a soma das horas
        let totalMilliseconds = 0;
        const attendedEvents = new Set(); // Para não somar o mesmo evento várias vezes
        checkins.forEach(checkin => {
            if (!attendedEvents.has(checkin.eventId)) {
                const duration = new Date(checkin.event.endDate) - new Date(checkin.event.startDate);
                totalMilliseconds += duration;
                attendedEvents.add(checkin.eventId);
            }
        });
        const totalHours = (totalMilliseconds / (1000 * 60 * 60)).toFixed(1);

        // 5. Gerar o PDF (lógica similar à do crachá)
        const templateBytes = await fetch(parentEvent.certificateTemplateUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(templateBytes);
        const firstPage = pdfDoc.getPages()[0];
        
        // Exemplo: Adicionar nome e horas ao PDF (ajuste as coordenadas X e Y)
        firstPage.drawText(user.name, {
            x: 200, // Posição X do nome
            y: 300, // Posição Y do nome
            size: 24,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(`${totalHours} horas`, {
            x: 350, // Posição X das horas
            y: 250, // Posição Y das horas
            size: 18,
            color: rgb(0.5, 0.5, 0.5),
        });

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Disposition', `attachment; filename="certificado_${user.name}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Erro ao gerar certificado:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
}

module.exports = { generateCertificate };