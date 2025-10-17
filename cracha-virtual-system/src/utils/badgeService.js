// ARQUIVO: src/lib/badgeService.js

const QRCode = require("qrcode");

/**
 * Constrói uma URL de imagem absoluta, garantindo que não haja barras duplas.
 * @param {string} baseUrl - A URL base da API (ex: https://api.checkin.simplisoft.com.br).
 * @param {string} relativePath - O caminho relativo da imagem (ex: /uploads/photo.png).
 * @returns {string} A URL completa e segura.
 */
const getAbsoluteUrl = (baseUrl, relativePath) => {
  if (!relativePath) return ""; // Retorna string vazia se não houver caminho
  // Evita barras duplas caso o relativePath já venha com a URL completa por algum motivo
  if (relativePath.startsWith("http")) {
    return relativePath;
  }
  return `${baseUrl}${relativePath}`;
};

/**
 * Gera o HTML completo de um crachá para ser usado em e-mails.
 */
const generateBadgeHtml = async (user, badge, awards = []) => {
  const qrCodeData = JSON.stringify({
    userId: user.id,
    badgeCode: badge.badgeCode,
    badgeType: "user",
  });
  const qrCodeImage = await QRCode.toDataURL(qrCodeData, { width: 200 });

  const baseUrl = process.env.PUBLIC_API_URL;
  // MUDANÇA: Adicionamos uma variável de ambiente para a URL do logo
  const logoUrl = process.env.PUBLIC_LOGO_URL;
  const userPhotoUrl = getAbsoluteUrl(baseUrl, user.photoUrl);

  const latestAwards = Array.isArray(awards) ? awards.slice(0, 5) : [];
  const awardsHtml = latestAwards
    .map(
      (awardItem) => `
    <img 
      src="${getAbsoluteUrl(baseUrl, awardItem.award.imageUrl)}" 
      alt="${awardItem.award.name}" 
      title="${awardItem.award.name}" 
      style="height: 28px; width: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5);"
    />
  `
    )
    .join("");

  const badgeHtml = `
    <div style="width: 320px; height: 512px; border-radius: 1rem; color: white; background: linear-gradient(to bottom right, #1f2937, #111827, #000); padding: 24px; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
      
      <div style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="Logo Prof Presente" style="height: 28px;" />`
            : "<span></span>"
        }
        <div style="display: flex; gap: 8px;">
          ${awardsHtml}
        </div>
      </div>

      <div style="text-align: center;">
        <img src="${userPhotoUrl}" alt="${
    user.name
  }" style="width: 96px; height: 96px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.8); object-fit: cover; margin-bottom: 4px;" />
        <h2 style="font-size: 1.5rem; font-weight: bold; margin: 0;">${
          user.name
        }</h2>
      </div>

      <div style="background-color: rgba(255, 255, 255, 0.95); padding: 16px; border-radius: 0.75rem; width: 100%; text-align: center;">
        <img src="${qrCodeImage}" alt="QR Code" style="width: 100%; max-width: 180px; height: auto; margin: 0 auto;" />
        <p style="margin-top: 8px; font-family: monospace; font-size: 0.875rem; font-weight: bold; letter-spacing: 0.05em; color: #1f2937;">
          ${badge.badgeCode}
        </p>
      </div>

    </div>
  `;

  return badgeHtml;
};

module.exports = { generateBadgeHtml };
