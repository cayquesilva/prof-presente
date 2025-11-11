const QRCode = require("qrcode");

/**
 * Constrói uma URL de imagem absoluta, garantindo que não haja barras duplas.
 */
const getAbsoluteUrl = (baseUrl, relativePath) => {
  if (!relativePath) return "";
  if (relativePath.startsWith("http") || relativePath.startsWith("data:")) {
    return relativePath;
  }

  // Garante que a baseUrl não tenha barra no final e o path tenha no início
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;

  return `${cleanBase}${cleanPath}`;
};

/**
 * Gera um avatar em SVG com as iniciais do usuário.
 */
const generateInitialsAvatar = (name) => {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const svg = `
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <circle cx="48" cy="48" r="48" fill="#374151"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        fill="white"
        font-size="40px"
        font-family="Arial, sans-serif"
        font-weight="bold"
      >
        ${initials}
      </text>
    </svg>
  `;

  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    "base64"
  )}`;

  return dataUri;
};

/**
 * Gera o HTML completo de um crachá para ser usado em e-mails e PNGs.
 */
const generateBadgeHtml = (user, badge, awards = []) => {
  // O seu log mostrou que estas variáveis ESTÃO SENDO CARREGADAS.
  const baseUrl = process.env.PUBLIC_API_URL;
  const logoUrl = process.env.PUBLIC_LOGO_URL;

  // Log de aviso para o desenvolvimento
  if (!baseUrl) {
    console.warn(`
      AVISO: process.env.PUBLIC_API_URL não está definida. 
      As imagens do crachá (logo, avatar, qr) estarão quebradas.
      Defina-a no seu arquivo .env
    `);
  }

  const userPhotoSource = user.photoUrl
    ? getAbsoluteUrl(baseUrl, user.photoUrl)
    : generateInitialsAvatar(user.name);

  // Lógica do QR Code simplificada
  const qrCodeUrl = getAbsoluteUrl(baseUrl, badge.qrCodeUrl);

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

  // Este é o layout CORRETO (320x512)
  const badgeHtml = `
    <div style="width: 320px; height: 560px; border-radius: 1rem; color: white; background-color: #111827; background: linear-gradient(to bottom right, #1f2937, #111827, #000); padding: 24px; font-family: Arial, sans-serif; box-sizing: border-box;">
      
      <table style="width: 100%; height: 100%; border-collapse: collapse;">
        
        <tr style="height: 1px;">
          <td style="vertical-align: top; padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0; text-align: left;">
                  <img src="${logoUrl}" alt="Logo" style="height: 28px;" />
                </td>
                <td style="padding: 0; text-align: right;">
                  <div style="display: inline-block; gap: 8px;">
                    ${awardsHtml}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="vertical-align: middle; text-align: center; padding: 8px 0;">
            <img 
              src="${userPhotoSource}" 
              alt="${user.name}" 
              style="width: 96px; height: 96px; border-radius: 50%; margin-bottom: 4px; border: 2px solid rgba(255,255,255,0.8); object-fit: cover;" 
            />
            <h2 style="font-size: 1.5rem; font-weight: bold; margin: 0; line-height: 1.2; word-wrap: break-word; color: #FFFFFF;">
              ${user.name}
            </h2>
          </td>
        </tr>

        <tr style="height: 1px;">
          <td style="vertical-align: bottom; padding: 0; padding-top: 8px;">
            <div style="background-color: rgba(255, 255, 255, 0.95); padding: 16px; border-radius: 0.75rem; width: 100%; text-align: center; box-sizing: border-box;">
              <img 
                src="${qrCodeUrl}" 
                alt="QR Code" 
                style="width: 100%; max-width: 256px; height: auto; margin: 0 auto;" 
              />
              <p style="margin-top: 8px; font-family: monospace; font-size: 0.875rem; font-weight: bold; letter-spacing: 0.05em; color: #1f2937; word-wrap: break-word;">
                ${badge.badgeCode}
              </p>
            </div>
          </td>
        </tr>

      </table>
    </div>
  `;

  return badgeHtml;
};

module.exports = { generateBadgeHtml };
