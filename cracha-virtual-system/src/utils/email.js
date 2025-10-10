const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envia um e-mail com anexo.
 * @param {string} to - Destinatário do e-mail.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} html - Conteúdo HTML do e-mail.
 * @param {Array} attachments - Array de anexos. Ex: [{ filename: 'certificado.pdf', content: pdfBuffer }]
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
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

module.exports = { sendEmail };
