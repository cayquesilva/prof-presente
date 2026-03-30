const { prisma } = require("../config/database");
const youtubeService = require("../services/youtubeService");

/**
 * Cria ou atualiza a Live Stream vinculada a um evento
 */
const upsertLiveStream = async (req, res) => {
    try {
        const { eventId } = req.params;
        let { provider, streamId, status } = req.body;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        // AUTO-CREATION LOGIC
        if (streamId === "auto") {
            try {
                streamId = await youtubeService.createLiveBroadcast(
                    `Transmissão: ${event.title}`,
                    event.description,
                    event.startDate
                );
                provider = "YOUTUBE";
            } catch (err) {
                console.error("Erro criação automática YouTube:", err);
                return res.status(400).json({ error: err.message || "Erro ao gerar transmissão automaticamente." });
            }
        }

        const liveStream = await prisma.liveStream.upsert({
            where: { eventId },
            update: {
                provider,
                streamId,
                status,
            },
            create: {
                eventId,
                provider: provider || "YOUTUBE",
                streamId,
                status: status || "SCHEDULED",
            },
        });

        res.json(liveStream);
    } catch (error) {
        console.error("Erro ao gerenciar Live Stream:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Busca a Live Stream (Permitir apenas se usuário estiver inscrito ou for admin/staff)
 */
const getLiveStream = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        // Verificar se a LiveStream existe
        const liveStream = await prisma.liveStream.findUnique({
            where: { eventId },
        });

        if (!liveStream) {
            return res.status(404).json({ error: "Live Stream não encontrada" });
        }

        // Admins e Staff podem ver sempre
        if (req.user.role === "ADMIN" || req.user.role === "cerimonial") {
            return res.json(liveStream);
        }

        const staff = await prisma.eventStaff.findUnique({
            where: { userId_eventId: { userId, eventId } },
        });
        if (staff) {
            return res.json(liveStream);
        }

        // Verificar se o usuário está inscrito
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });

        if (!enrollment || enrollment.status !== "APPROVED") {
            return res.status(403).json({ error: "Acesso negado. Você não está inscrito ou sua inscrição não foi aprovada." });
        }

        res.json(liveStream);
    } catch (error) {
        console.error("Erro ao buscar Live Stream:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Registra o tempo assistido para automatizar o checkin
 */
const pingAttendance = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;
        const userId = req.user.id;

        // Atualiza o attendance incrementando 60 segundos
        const attendance = await prisma.liveAttendance.upsert({
            where: {
                liveStreamId_userId: {
                    liveStreamId,
                    userId,
                },
            },
            update: {
                watchTimeSeconds: {
                    increment: 60,
                },
                lastPingAt: new Date(),
            },
            create: {
                liveStreamId,
                userId,
                watchTimeSeconds: 60, // Começa com 60s
            },
            include: {
                liveStream: true, // Para obter o eventId
            }
        });

        // Lógica opcional de Check-in Automático
        // Exemplo: Se assistiu mais de 30 minutos (1800 segundos), realiza o check-in se não existir
        if (attendance.watchTimeSeconds >= 1800) {
            const eventId = attendance.liveStream.eventId;

            const userBadge = await prisma.userBadge.findUnique({
                where: { userId },
            });

            if (userBadge) {
                // Tenta registrar o checkin
                const existingCheckin = await prisma.userCheckin.findFirst({
                    where: { userBadgeId: userBadge.id, eventId }
                });

                if (!existingCheckin) {
                    await prisma.userCheckin.create({
                        data: {
                            userBadgeId: userBadge.id,
                            eventId: eventId,
                            location: "Online / Autocheckin"
                        }
                    });
                    console.log(`[LIVE STREAM] Check-in automático gerado para o usuário ${userId} no evento ${eventId}`);
                }
            }
        }

        res.json({ message: "Ping registrado", watchTimeSeconds: attendance.watchTimeSeconds });
    } catch (error) {
        console.error("Erro no ping attendance:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Busca histórico do chat
 */
const getChatHistory = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;

        const messages = await prisma.liveChatMessage.findMany({
            where: { liveStreamId, isBlocked: false },
            include: { user: { select: { id: true, name: true, photoUrl: true } } },
            orderBy: { createdAt: "asc" },
            take: 200, // as últimas 200 mensagens
        });

        res.json(messages);
    } catch (error) {
        console.error("Erro ao buscar chat:", error);
        res.status(500).json({ error: "Erro interno" });
    }
};

module.exports = {
    upsertLiveStream,
    getLiveStream,
    pingAttendance,
    getChatHistory
};
