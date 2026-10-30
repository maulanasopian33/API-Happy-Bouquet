const crypto = require('crypto');
const logger = require('./logger');

// Gunakan key 32 bytes untuk AES-256-GCM. Wajib di-set via environment variable.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (process.env.NODE_ENV === 'production') {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('[FATAL] ENCRYPTION_KEY wajib dikonfigurasi tepat 32 karakter di environment production!');
  }
} else if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  logger.warn('[WARN] ENCRYPTION_KEY harus 32 karakter. Menggunakan fallback hanya untuk development/testing.');
}

const KEY = ENCRYPTION_KEY || 'default_32_bytes_long_secret_key!';
const ALGORITHM = 'aes-256-gcm';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

const decrypt = (text) => {
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

module.exports = { encrypt, decrypt };
