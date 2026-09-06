const { ZodError } = require('zod');
const { AppError, ErrorCodes } = require('../constants/errors');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  // ─── Pastikan CORS headers selalu ada di error response ────────
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // 1. AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: false,
      message: err.message,
      data: null,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
      },
    });
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.issues.map((e) => ({
      field: e.path.join('.'),
      issue: e.message,
    }));

    return res.status(400).json({
      status: false,
      message: 'Input data gagal melewati validasi.',
      data: null,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Input data gagal melewati validasi.',
        details,
      },
    });
  }

  // 3. Sequelize Validation Error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const sequelizeErr = err;
    const details = sequelizeErr.errors?.map((e) => ({
      field: e.path,
      issue: e.message,
    }));
    const message = err.name === 'SequelizeUniqueConstraintError'
      ? 'Data sudah ada (duplikat).'
      : 'Validasi database gagal.';

    return res.status(400).json({
      status: false,
      message,
      data: null,
      error: {
        code: err.name === 'SequelizeUniqueConstraintError'
          ? ErrorCodes.ALREADY_EXISTS
          : ErrorCodes.VALIDATION_ERROR,
        message,
        details,
      },
    });
  }

  // 4. JWT Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token tidak valid.';
    return res.status(401).json({
      status: false,
      message,
      data: null,
      error: {
        code: ErrorCodes.TOKEN_INVALID,
        message,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token sudah kedaluwarsa.';
    return res.status(401).json({
      status: false,
      message,
      data: null,
      error: {
        code: ErrorCodes.TOKEN_EXPIRED,
        message,
      },
    });
  }

  // 5. CORS Error (dari middleware CORS)
  if (err.message && err.message.includes('CORS')) {
    logger.warn('CORS error', { origin: req.headers.origin, url: req.originalUrl });
    return res.status(403).json({
      status: false,
      message: 'CORS: Origin tidak diizinkan.',
      data: null,
      error: {
        code: ErrorCodes.FORBIDDEN,
        message: 'CORS: Origin tidak diizinkan.',
      },
    });
  }

  // 6. Generic Error (fallback)
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  const message = process.env.NODE_ENV === 'production'
    ? 'Terjadi kesalahan pada server.'
    : err.message;
  return res.status(500).json({
    status: false,
    message,
    data: null,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message,
    },
  });
};

module.exports = { errorHandler };
