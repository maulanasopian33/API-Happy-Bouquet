/**
 * Validasi fail-fast untuk variabel lingkungan penting sebelum server berjalan
 */

const logger = require('../utils/logger');

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  const errors = [];

  // 1. JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  const insecureSecrets = ['secret', 'your_jwt_secret', 'secret123', 'default_secret'];
  if (!jwtSecret || jwtSecret.trim() === '') {
    errors.push('JWT_SECRET wajib dikonfigurasi di environment production.');
  } else if (insecureSecrets.includes(jwtSecret.toLowerCase())) {
    errors.push('JWT_SECRET terlalu lemah/menggunakan nilai default di environment production.');
  }

  // 2. ENCRYPTION_KEY
  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey || encKey.length !== 32) {
    errors.push('ENCRYPTION_KEY wajib dikonfigurasi tepat 32 karakter di environment production.');
  }

  // 3. CORS_ORIGINS
  const corsOrigins = process.env.CORS_ORIGINS;
  if (!corsOrigins || corsOrigins.trim() === '') {
    errors.push('CORS_ORIGINS wajib disetel dengan domain frontend yang diizinkan di production.');
  }

  // 4. Database Credentials
  if (!process.env.DB_NAME) {
    errors.push('DB_NAME wajib ditentukan di environment production.');
  }

  if (errors.length > 0) {
    logger.error('[FATAL] Konfigurasi environment production tidak aman:');
    errors.forEach((err) => logger.error(` - ${err}`));
    throw new Error(`[FATAL] Konfigurasi environment production tidak valid:\n${errors.join('\n')}`);
  }
};

module.exports = { validateEnv };
