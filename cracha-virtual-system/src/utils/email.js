const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // Sua configuração está ótima
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envia um e-mail com anexo. (Sua função original)
 * @param {string} to - Destinatário do e-mail.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} html - Conteúdo HTML do e-mail.
 * @param {Array} attachments - Array de anexos. Ex: [{ filename: 'certificado.pdf', content: pdfBuffer }]
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  // Verificação para garantir que o 'from' está configurado
  const fromAddress = process.env.EMAIL_FROM || `"<${process.env.SMTP_USER}>"`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`E-mail enviado com sucesso para ${to}`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
  }
};

// --- FUNÇÕES ADICIONADAS ---

/**
 * Envia um e-mail de confirmação de inscrição usando a função genérica sendEmail.
 * @param {object} user - O objeto do usuário (precisa de name, email).
 * @param {object} event - O objeto do evento (precisa de title).
 * @param {object} userBadge - O objeto do crachá do usuário (precisa de qrCodeUrl).
 */
const sendEnrollmentConfirmationEmail = async (user, event, userBadge) => {
  if (!user.email) {
    console.error("Tentativa de enviar e-mail para usuário sem endereço:", user.id);
    return;
  }

  const subject = `Inscrição Confirmada: ${event.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Olá, ${user.name}!</h2>
      <p>Sua inscrição no evento <strong>${event.title}</strong> foi confirmada com sucesso.</p>
      <p>Para realizar o check-in no dia do evento, utilize o seu crachá universal. Apresente o QR Code abaixo na entrada:</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <img src="${userBadge.qrCodeUrl}" alt="Seu QR Code de Check-in" style="max-width: 200px;"/>
      </div>

      <p>Guarde este e-mail para fácil acesso.</p>
      <p>Atenciosamente,<br>Equipe Prof Presente</p>
    </div>
  `;

  await sendEmail({ to: user.email, subject, html });
};

/**
 * Envia um e-mail de cancelamento de inscrição usando a função genérica sendEmail.
 * @param {object} user - O objeto do usuário (precisa de name, email).
 * @param {object} event - O objeto do evento (precisa de title).
 */
const sendEnrollmentCancellationEmail = async (user, event) => {
  if (!user.email) {
    console.error("Tentativa de enviar e-mail para usuário sem endereço:", user.id);
    return;
  }

  const subject = `Inscrição Cancelada: ${event.title}`;
  const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Olá, ${user.name},</h2>
          <p>Confirmamos o cancelamento da sua inscrição no evento <strong>${event.title}</strong>.</p>
          <p>Se você não solicitou este cancelamento, por favor, entre em contato com o suporte.</p>
          <p>Esperamos te ver em eventos futuros!</p>
          <p>Atenciosamente,<br>Equipe Prof Presente</p>
      </div>
  `;
  
  await sendEmail({ to: user.email, subject, html });
};


module.exports = {
  sendEmail, // Sua função original
  sendEnrollmentConfirmationEmail, // Nova função
  sendEnrollmentCancellationEmail, // Nova função
};