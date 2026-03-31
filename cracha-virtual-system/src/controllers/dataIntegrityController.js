const { prisma } = require("../config/database");

/**
 * Endpoint para sincronizar inscrições legadas nas trilhas.
 * Percorre todos os usuários e garante que se estão em 1 evento da trilha, 
 * também estejam nos irmãos e na trilha em si, de acordo com a nova regra de negócio.
 */
const syncTrackEnrollments = async (req, res) => {
  try {
    const allTracks = await prisma.learningTrack.findMany({
      include: { events: true }
    });

    let syncCount = 0;

    for (const track of allTracks) {
      if (!track.events || track.events.length === 0) continue;

      const eventIdsInTrack = track.events.map(te => te.eventId);

      // Usúarios que possuem ao menos uma inscrição ativa em algum evento da trilha
      const enrollmentsInTrack = await prisma.enrollment.findMany({
        where: {
          eventId: { in: eventIdsInTrack },
          status: "APPROVED"
        },
        select: { userId: true },
        distinct: ['userId']
      });

      for (const { userId } of enrollmentsInTrack) {
        // 1. Garante que o usuário possua um TrackEnrollment (Não sobrescreve dados de progresso)
        await prisma.trackEnrollment.upsert({
          where: { trackId_userId: { trackId: track.id, userId } },
          update: {}, // Não toca nos dados se já existir
          create: { trackId: track.id, userId, progress: 0, isCompleted: false },
        });

        // 2. Garante que o usuário possua Enrollment em todos os eventos da trilha (De forma ADITIVA)
        for (const te of track.events) {
          const existing = await prisma.enrollment.findUnique({
            where: { userId_eventId: { userId, eventId: te.eventId } },
          });

          if (!existing) {
            await prisma.enrollment.create({
              data: { userId, eventId: te.eventId, status: "APPROVED" },
            });
          }
        }
        syncCount++;
      }
    }

    res.status(200).json({ 
      message: "Sincronização de inscrições em trilhas concluída com sucesso.", 
      syncCount 
    });
  } catch (error) {
    console.error("Erro na sincronização de trilhas:", error);
    res.status(500).json({ error: "Erro interno ao executar sincronização de trilhas." });
  }
};

module.exports = {
  syncTrackEnrollments
};
