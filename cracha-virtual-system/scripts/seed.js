const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const fs = require("fs").promises;
const path = require("path");

const prisma = new PrismaClient();

const getDynamicDate = (daysOffset, isPast = false) => {
  const date = new Date();
  if (isPast) {
    date.setDate(date.getDate() - daysOffset);
  } else {
    date.setDate(date.getDate() + daysOffset);
  }
  return date;
};

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    // Limpar dados existentes (em ordem devido às dependências)
    console.log("🧹 Limpando dados existentes...");

    await prisma.courseEvaluation.deleteMany();
    await prisma.checkin.deleteMany();
    await prisma.userAward.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.award.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // Criar usuários
    console.log("👥 Criando usuários...");

    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await prisma.user.create({
      data: {
        name: "Administrador Sistema",
        email: "admin@cracha.com",
        password: hashedPassword,
        role: "ADMIN",
        birthDate: new Date("1985-01-15"),
        cpf: "123.456.789-00",
        phone: "(11) 99999-0000",
        address: "Rua Admin, 123, São Paulo, SP",
      },
    });

    const users = [];
    const userNames = [
      "João Silva",
      "Maria Santos",
      "Carlos Oliveira",
      "Ana Costa",
      "Pedro Ferreira",
      "Lucia Rodrigues",
      "Rafael Lima",
      "Fernanda Alves",
      "Bruno Pereira",
      "Camila Souza",
    ];

    for (let i = 0; i < userNames.length; i++) {
      const user = await prisma.user.create({
        data: {
          name: userNames[i],
          email: `user${i + 1}@cracha.com`,
          password: hashedPassword,
          role: "USER",
          birthDate: new Date(
            1990 + Math.floor(Math.random() * 20),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          cpf: `${String(i + 1).padStart(3, "0")}.${String(i + 1).padStart(
            3,
            "0"
          )}.${String(i + 1).padStart(3, "0")}-${String(i + 1).padStart(
            2,
            "0"
          )}`,
          phone: `(11) 9999${String(i + 1).padStart(4, "0")}`,
          address: `Rua ${userNames[i].split(" ")[0]}, ${
            (i + 1) * 10
          }, São Paulo, SP`,
        },
      });
      users.push(user);
    }

    console.log(`✅ Criados ${users.length + 1} usuários`);

    // Criar eventos
    console.log("📅 Criando eventos...");

    const eventData = [
      {
        title: "Conferência de Tecnologia (Evento Passado)",
        description:
          "O maior evento de tecnologia do ano com palestrantes renomados e workshops práticos.",
        startDate: getDynamicDate(30, true), // 30 dias no passado
        endDate: getDynamicDate(28, true), // 28 dias no passado
        location: "Centro de Convenções Anhembi, São Paulo",
        maxAttendees: 500,
      },
      {
        title: "Workshop de React e Node.js (Em Andamento)",
        description:
          "Workshop intensivo de desenvolvimento full-stack com React no frontend e Node.js no backend.",
        startDate: getDynamicDate(1, true), // Ontem
        endDate: getDynamicDate(1, false), // Amanhã
        location: "Laboratório de Informática - FIAP",
        maxAttendees: 50,
      },
      {
        title: "Seminário de Inteligência Artificial (Próximo)",
        description:
          "Explore o futuro da IA com especialistas da área. Discussões sobre machine learning e deep learning.",
        startDate: getDynamicDate(15, false), // Daqui a 15 dias
        endDate: getDynamicDate(15, false), // Mesmo dia
        location: "Auditório da USP, São Paulo",
        maxAttendees: 200,
      },
      {
        title: "Curso de DevOps e Cloud Computing (Futuro)",
        description:
          "Curso completo sobre DevOps, containerização com Docker, Kubernetes e deploy em nuvem AWS.",
        startDate: getDynamicDate(45, false), // Daqui a 45 dias
        endDate: getDynamicDate(49, false), // Dura 4 dias
        location: "Centro de Treinamento TechLab",
        maxAttendees: 30,
      },
      {
        title: "Hackathon Inovação Digital (Futuro Distante)",
        description:
          "48 horas de pura criatividade e código. Desenvolva soluções inovadoras para problemas reais.",
        startDate: getDynamicDate(90, false), // Daqui a 90 dias
        endDate: getDynamicDate(92, false), // Dura 2 dias
        location: "Hub de Inovação - Vila Madalena",
        maxAttendees: 100,
      },
    ];

    const eventPromises = eventData.map((data) =>
      prisma.event.create({ data })
    );
    const events = await Promise.all(eventPromises);
    console.log(`✅ Criados ${events.length} eventos`);

    // Criar premiações
    console.log("🏆 Criando premiações...");

    const awards = [];
    const awardData = [
      {
        name: "Primeiro Check-in",
        description: "Parabéns pelo seu primeiro check-in no sistema!",
        criteria: "Realizar o primeiro check-in em qualquer evento",
      },
      {
        name: "Participante Assíduo",
        description: "Você é um participante dedicado!",
        criteria: "Realizar check-in em 3 eventos diferentes",
      },
      {
        name: "Frequentador VIP",
        description: "Sua presença é sempre marcante!",
        criteria: "Realizar 5 check-ins ou mais",
      },
      {
        name: "Expert em Tecnologia",
        description: "Especialista em eventos de tecnologia",
        criteria: "Participar de 5 eventos de tecnologia",
      },
      {
        name: "Networking Master",
        description: "Mestre em networking e conexões",
        criteria: "Realizar 10 check-ins ou mais",
      },
    ];

    for (const awardInfo of awardData) {
      const award = await prisma.award.create({
        data: awardInfo,
      });
      awards.push(award);
    }

    console.log(`✅ Criadas ${awards.length} premiações`);

    // Criar inscrições
    console.log("📝 Criando inscrições...");

    const enrollments = [];

    // Inscrever usuários em eventos (distribuição aleatória)
    for (const user of users) {
      const numEnrollments = Math.floor(Math.random() * 3) + 1; // 1-3 inscrições por usuário
      const userEvents = events
        .sort(() => 0.5 - Math.random())
        .slice(0, numEnrollments);

      for (const event of userEvents) {
        const enrollment = await prisma.enrollment.create({
          data: {
            userId: user.id,
            eventId: event.id,
            status: Math.random() > 0.1 ? "APPROVED" : "PENDING", // 90% aprovadas
            enrollmentDate: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ), // Últimos 30 dias
          },
        });
        enrollments.push(enrollment);
      }
    }

    console.log(`✅ Criadas ${enrollments.length} inscrições`);

    // Criar crachás para inscrições aprovadas
    console.log("🎫 Criando crachás...");

    const approvedEnrollments = enrollments.filter(
      (e) => e.status === "APPROVED"
    );
    const badges = [];

    // Garantir que o diretório de QR codes existe
    const qrCodeDir = path.join(process.cwd(), "uploads", "qrcodes");
    await fs.mkdir(qrCodeDir, { recursive: true });

    for (const enrollment of approvedEnrollments) {
      // Dados para o QR code
      const qrData = {
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        eventId: enrollment.eventId,
        timestamp: Date.now(),
      };

      // Gerar QR code
      const qrCodeFileName = `badge_${enrollment.id}.png`;
      const qrCodePath = path.join(qrCodeDir, qrCodeFileName);

      await QRCode.toFile(qrCodePath, JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Criar crachá
      const badge = await prisma.badge.create({
        data: {
          enrollmentId: enrollment.id,
          qrCodeUrl: `/uploads/qrcodes/${qrCodeFileName}`,
          badgeImageUrl: `/uploads/badges/badge_${enrollment.id}.png`, // Placeholder
          issuedAt: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Válido por 1 ano
        },
      });
      badges.push(badge);
    }

    console.log(`✅ Criados ${badges.length} crachás com QR codes`);

    // Criar check-ins
    console.log("✅ Criando check-ins...");

    const checkins = [];

    // Simular check-ins para alguns crachás
    for (const badge of badges) {
      if (Math.random() > 0.3) {
        // 70% dos crachás têm check-in
        const numCheckins = Math.floor(Math.random() * 3) + 1; // 1-3 check-ins por crachá

        for (let i = 0; i < numCheckins; i++) {
          const checkin = await prisma.checkin.create({
            data: {
              badgeId: badge.id,
              checkinTime: new Date(
                Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
              ), // Últimos 7 dias
              location: "Entrada Principal",
            },
          });
          checkins.push(checkin);
        }
      }
    }

    console.log(`✅ Criados ${checkins.length} check-ins`);

    // Conceder premiações automáticas
    console.log("🏅 Concedendo premiações...");

    const userAwards = [];

    for (const user of users) {
      const userCheckins = await prisma.checkin.count({
        where: {
          badge: {
            enrollment: {
              userId: user.id,
            },
          },
        },
      });

      const userEvents = await prisma.enrollment.count({
        where: {
          userId: user.id,
          status: "APPROVED",
        },
      });

      // Lógica de premiações
      const userAwardsToGrant = [];

      if (userCheckins >= 1) {
        userAwardsToGrant.push(
          awards.find((a) => a.name === "Primeiro Check-in")
        );
      }

      if (userEvents >= 3) {
        userAwardsToGrant.push(
          awards.find((a) => a.name === "Participante Assíduo")
        );
      }

      if (userCheckins >= 5) {
        userAwardsToGrant.push(
          awards.find((a) => a.name === "Frequentador VIP")
        );
      }

      if (userCheckins >= 10) {
        userAwardsToGrant.push(
          awards.find((a) => a.name === "Networking Master")
        );
      }

      for (const award of userAwardsToGrant.filter(Boolean)) {
        const userAward = await prisma.userAward.create({
          data: {
            userId: user.id,
            awardId: award.id,
          },
        });
        userAwards.push(userAward);
      }
    }

    console.log(`✅ Concedidas ${userAwards.length} premiações`);

    // Criar algumas avaliações
    console.log("⭐ Criando avaliações...");

    const evaluations = [];

    // Avaliar eventos passados
    const pastEnrollments = enrollments
      .filter((e) => e.status === "APPROVED")
      .slice(0, 10);

    for (const enrollment of pastEnrollments) {
      if (Math.random() > 0.4) {
        // 60% das inscrições têm avaliação
        const evaluation = await prisma.courseEvaluation.create({
          data: {
            enrollmentId: enrollment.id,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 estrelas
            comment: [
              "Excelente evento, muito bem organizado!",
              "Conteúdo de alta qualidade e palestrantes experientes.",
              "Superou minhas expectativas, recomendo!",
              "Ótima oportunidade de networking.",
              "Aprendi muito, valeu a pena participar.",
            ][Math.floor(Math.random() * 5)],
          },
        });
        evaluations.push(evaluation);
      }
    }

    console.log(`✅ Criadas ${evaluations.length} avaliações`);

    // Estatísticas finais
    console.log("\n📊 Resumo dos dados criados:");
    console.log(
      `👥 Usuários: ${users.length + 1} (${users.length} usuários + 1 admin)`
    );
    console.log(`📅 Eventos: ${events.length}`);
    console.log(`🏆 Premiações: ${awards.length}`);
    console.log(`📝 Inscrições: ${enrollments.length}`);
    console.log(`🎫 Crachás: ${badges.length}`);
    console.log(`✅ Check-ins: ${checkins.length}`);
    console.log(`🏅 Premiações concedidas: ${userAwards.length}`);
    console.log(`⭐ Avaliações: ${evaluations.length}`);

    console.log("\n🎉 Seed concluído com sucesso!");
    console.log("\n📋 Credenciais de acesso:");
    console.log("👨‍💼 Admin: admin@cracha.com / 123456");
    console.log(
      "👤 Usuário: user1@cracha.com / 123456 (ou user2, user3, etc.)"
    );
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
