/**
 * Helper utilitas CORS dan allowlist origin
 */

const isOriginAllowed = (origin) => {
  if (!origin) return true; // request tanpa origin (curl, mobile app, server-to-server)
  if (process.env.NODE_ENV !== 'production') return true; // izinkan semua di dev & test

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  if (allowedOrigins.length === 0) return false; // tolak jika di production tanpa konfigurasi
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

