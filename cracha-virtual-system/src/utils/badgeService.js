// ARQUIVO: src/lib/badgeService.js

const QRCode = require("qrcode");

/**
 * Constrói uma URL de imagem absoluta, garantindo que não haja barras duplas.
 * @param {string} baseUrl - A URL base da API (ex: https://api.checkin.simplisoft.com.br).
 * @param {string} relativePath - O caminho relativo da imagem (ex: /uploads/photo.png).
 * @returns {string} A URL completa e segura.
 */
const getAbsoluteUrl = (baseUrl, relativePath) => {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `${baseUrl}${relativePath}`;
};

/**
 * NOVA FUNÇÃO: Gera um avatar em SVG com as iniciais do usuário.
 * Imita a lógica do componente <AvatarFallback> do frontend.
 * @param {string} name - O nome completo do usuário.
 * @returns {string} Uma imagem SVG em formato Data URI (Base64).
 */
const generateInitialsAvatar = (name) => {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2); // Limita a 2 caracteres

  // Cria um SVG como uma string de texto
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

  // Converte a string SVG para Base64 e cria um Data URI
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    "base64"
  )}`;

  return dataUri;
};

/**
 * Gera o HTML completo de um crachá para ser usado em e-mails.
 */
const generateBadgeHtml = (user, badge, awards = []) => {
  const baseUrl = process.env.PUBLIC_API_URL;
  const logoUrl = process.env.PUBLIC_LOGO_URL;

  const userPhotoSource = user.photoUrl
    ? getAbsoluteUrl(baseUrl, user.photoUrl)
    : generateInitialsAvatar(user.name);

  // --- MUDANÇA PRINCIPAL AQUI ---

  // 1. Pega o caminho completo do sistema de arquivos salvo no banco.
  const filesystemPath = badge.qrCodeUrl; // Ex: /app/uploads/qrcodes/arquivo.png
  let relativeWebPath = "";

  if (filesystemPath) {
    // 2. Encontra o início da parte pública do caminho ("uploads").
    const uploadsIndex = filesystemPath.indexOf("uploads");

    if (uploadsIndex !== -1) {
      // 3. Extrai apenas a parte relevante (uploads/qrcodes/arquivo.png)
      //    e garante que comece com uma barra "/".
      relativeWebPath = "/" + filesystemPath.substring(uploadsIndex);
    } else {
      console.error(
        'Formato de qrCodeUrl inesperado. "uploads" não encontrado:',
        filesystemPath
      );
    }
  }

  // 4. Usa o caminho da web corrigido para montar a URL absoluta.
  const qrCodeUrl = getAbsoluteUrl(baseUrl, relativeWebPath);

  // ------------------------------------

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
    <div style="width: 320px; height: 512px; border-radius: 1rem; color: white; background: linear-gradient(to bottom right, #1f2937, #111827, #000); padding: 24px; font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: space-between; align-items: center;">

      <!-- 1. HEADER: Logo e Insígnias -->
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
        <img src="${logoUrl}" alt="Logo" style="height: 28px;" />
        <div style="display: flex; gap: 8px;">
          ${awardsHtml}
        </div>
      </div>

      <!-- 2. MEIO: Avatar e Nome -->
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 8px;">
        <img 
          src="${userPhotoSource}" 
          alt="${user.name}" 
          style="width: 96px; height: 96px; border-radius: 50%; margin-bottom: 4px; border: 2px solid rgba(255,255,255,0.8); object-fit: cover;" 
        />
        <h2 style="font-size: 1.5rem; font-weight: bold; margin: 0; line-height: 1.2;">
          ${user.name}
        </h2>
      </div>

      <!-- 3. BAIXO: QR Code -->
      <div style="background-color: rgba(255, 255, 255, 0.95); padding: 16px; border-radius: 0.75rem; width: 100%; text-align: center;">
        <img 
          src="${qrCodeUrl}" 
          alt="QR Code" 
          style="width: 100%; max-width: 256px; height: auto; margin: 0 auto;" 
        />
        <p style="margin-top: 8px; font-family: monospace; font-size: 0.875rem; font-weight: bold; letter-spacing: 0.05em; color: #1f2937;">
          ${badge.badgeCode}
        </p>
      </div>

    </div>
  `;

  return badgeHtml;
};

module.exports = { generateBadgeHtml };
