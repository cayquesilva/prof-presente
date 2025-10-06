import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// O '.origin' de uma URL pega apenas o protocolo e o domínio (ex: https://api.checkin.simplisoft.com.br)
const API_BASE_URL = new URL(import.meta.env.VITE_API_URL).origin;

/**
 * Monta a URL completa para um arquivo do backend.
 * @param {string} relativePath - O caminho relativo do arquivo (ex: /uploads/profiles/foto.png).
 * @returns {string} A URL completa e acessível.
 */
export const getAssetUrl = (relativePath) => {
  if (!relativePath) {
    return '';
  }
  
  if (relativePath.startsWith('http') || relativePath.startsWith('blob:')) {
    return relativePath;
  }
  
  // A lógica aqui permanece a mesma, mas agora usa a API_BASE_URL corrigida.
  return `${API_BASE_URL}${relativePath}`;
};
