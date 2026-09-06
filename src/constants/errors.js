/**
 * Standarisasi kode error API — SCREAMING_SNAKE_CASE
 * Digunakan oleh global error handler & response helper
 */

const ErrorCodes = {
  // Auth & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business Logic
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  RESELLER_NOT_ACTIVE: 'RESELLER_NOT_ACTIVE',
  RESELLER_PENDING: 'RESELLER_PENDING',
  RESELLER_SUSPENDED: 'RESELLER_SUSPENDED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
};

/**
 * Custom AppError class untuk throw error terstruktur
 */
class AppError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

module.exports = { ErrorCodes, AppError };
