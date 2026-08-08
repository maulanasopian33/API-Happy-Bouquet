import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCodes } from '../constants/errors';
import logger from '../utils/logger';

/**
 * Global Error Handler Middleware
 * Tangkap semua error dan format response seragam
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  // 1. AppError — error terstruktur dari kode kita
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
    const details = err.issues.map((e: any) => ({
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
    const sequelizeErr = err as any;
    const details = sequelizeErr.errors?.map((e: any) => ({
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

  // 5. Generic Error (fallback)
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
