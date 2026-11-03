const REDACTED = '[REDACTED]';
const MAX_DEPTH = 4;

const SENSITIVE_KEY =
  /^(password|passwd|pwd|token|access_?token|refresh_?token|authorization|api[-_]?key|secret|cookie|set-cookie|encryption_?key|jwt|session)$/i;

const isSensitiveKey = (key) => SENSITIVE_KEY.test(String(key));

/**
 * Salin nilai log sambil menyamarkan field sensitif (password/token/apiKey/...).
 * Catatan: hanya level key, isi string panjang seperti "?token=..." tidak disamarkan.
 */
const sanitize = (value, depth = 0) => {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (depth >= MAX_DEPTH) return '[MaxDepth]';
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? REDACTED : sanitize(item, depth + 1),
    ])
  );
};

module.exports = { sanitize, isSensitiveKey, REDACTED };
