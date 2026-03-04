const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// A clean dark placeholder as base64 PNG (40x40 grey square)
export const FALLBACK = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#1a1a1a"/><rect x="160" y="110" width="80" height="60" rx="8" fill="#333"/><circle cx="175" cy="128" r="8" fill="#444"/><polygon points="155,170 200,130 230,155 255,135 285,170" fill="#333"/><text x="200" y="210" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#555">No Image</text></svg>')}`;

export function resolveImage(url) {
  if (!url || url.trim() === '') return FALLBACK;
  if (url.startsWith('/uploads/')) return `${SERVER_URL}${url}`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return FALLBACK;
}