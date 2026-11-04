/**
 * Helper utilitas CORS dan allowlist origin
 */

const DEFAULT_PRODUCTION_ORIGINS = [
  'https://happybouquet.web.id',
  'https://www.happybouquet.web.id',
  'https://panel.happybouquet.web.id',
  'https://admin.happybouquet.web.id',
];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // request tanpa origin (curl, mobile app, server-to-server)
  if (process.env.NODE_ENV !== 'production') return true; // izinkan semua di dev & test

  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  // Gabungkan konfigurasi .env dengan domain resmi produksi sebagai fail-safe
  const allowedOrigins = Array.from(new Set([...DEFAULT_PRODUCTION_ORIGINS, ...configuredOrigins]));

  return allowedOrigins.includes(origin);
};

const applyCorsHeaders = (res, origin) => {
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
};

module.exports = {
  isOriginAllowed,
  applyCorsHeaders,
};

