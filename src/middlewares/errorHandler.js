const { ZodError } = require('zod');
const { AppError, ErrorCodes } = require('../constants/errors');
const logger = require('../utils/logger');
const { applyCorsHeaders } = require('../utils/cors');

const statusOf = (err) => {
  if (err instanceof AppError) return err.statusCode;
  if (err instanceof ZodError) return 400;
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') return 400;
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return 401;
  if (err.message && err.message.includes('CORS')) return 403;
  return 500;
};

const sendError = (req, res, statusCode, message, code, details = null) =>
  res.status(statusCode).json({
    status: false,
    message,
    data: null,
    error: { code, message, details, requestId: req.id || null },
  });

const errorHandler = (err, req, res, _next) => {
  // Terapkan CORS headers hanya jika origin diizinkan (mencegah arbitrary origin reflection)
  applyCorsHeaders(res, req.headers.origin);

  const status = statusOf(err);
  const level = status >= 500 ? 'error' : 'warn';

  logger.log(level, 'http_error', {
    requestId: req.id || null,
    method: req.method,
    path: req.originalUrl.split('?')[0],
    status,
    userId: req.user?.id || null,
    ip: req.ip,
    code: err.code || err.name || 'Error',
    message: err.message,
    stack: err.stack,
  });

  // 1. AppError
  if (err instanceof AppError) {
    return sendError(req, res, err.statusCode, err.message, err.code, err.details || null);
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.issues.map((e) => ({
      field: e.path.join('.'),
      issue: e.message,
    }));

    return sendError(
      req,
      res,
      400,
      'Input data gagal melewati validasi.',
      ErrorCodes.VALIDATION_ERROR,
      details
    );
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

    return sendError(
      req,
      res,
      400,
      message,
      err.name === 'SequelizeUniqueConstraintError' ? ErrorCodes.ALREADY_EXISTS : ErrorCodes.VALIDATION_ERROR,
      details
    );
  }

  // 4. JWT Error
  if (err.name === 'JsonWebTokenError') {
    return sendError(req, res, 401, 'Token tidak valid.', ErrorCodes.TOKEN_INVALID);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(req, res, 401, 'Token sudah kedaluwarsa.', ErrorCodes.TOKEN_EXPIRED);
  }

  // 5. CORS Error (dari middleware CORS)
  if (err.message && err.message.includes('CORS')) {
    return sendError(req, res, 403, 'CORS: Origin tidak diizinkan.', ErrorCodes.FORBIDDEN, {
      origin: req.headers.origin,
    });
  }

  // 6. Generic Error (fallback) — detail disembunyikan di production.
  const message = process.env.NODE_ENV === 'production'
    ? 'Terjadi kesalahan pada server.'
    : err.message;

  return sendError(req, res, 500, message, ErrorCodes.INTERNAL_ERROR);
};

module.exports = { errorHandler };
