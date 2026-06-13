import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCodes } from '../constants/errors';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Middleware: Verifikasi JWT Token
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === 'null') {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Akses ditolak. Token tidak ditemukan.',
      },
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET tidak dikonfigurasi di environment.', 500, ErrorCodes.INTERNAL_ERROR);
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      const code = err.name === 'TokenExpiredError' ? ErrorCodes.TOKEN_EXPIRED : ErrorCodes.TOKEN_INVALID;
      return res.status(401).json({
        success: false,
        error: {
          code,
          message: err.name === 'TokenExpiredError' ? 'Token sudah kedaluwarsa.' : 'Token tidak valid.',
        },
      });
    }
    req.user = decoded as AuthRequest['user'];
    next();
  });
};

/**
 * Middleware: Role-based Authorization
 * Penggunaan: authorizeRoles('admin', 'super_admin')
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Autentikasi diperlukan.',
        },
      });
    }

    // Normalisasi role ke lowercase untuk perbandingan yang konsisten
    const userRole = req.user.role?.toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: `Akses ditolak. Memerlukan role: ${allowedRoles.join(', ')}.`,
        },
      });
    }

    next();
  };
};

/**
 * Middleware: Pastikan user adalah reseller aktif
 */
export const requireActiveReseller = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role?.toLowerCase() !== 'reseller') {
      return res.status(403).json({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'Akses hanya untuk reseller.',
        },
      });
    }

    // Lazy import to avoid circular dependency
    const db = (await import('../models')).default;

    const reseller = await db.Reseller.findOne({
      where: { user_id: req.user.id },
    });

    if (!reseller) {
      return res.status(404).json({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Profil reseller tidak ditemukan.',
        },
      });
    }

    if (reseller.status !== 'active') {
      const codeMap: Record<string, string> = {
        pending_review: ErrorCodes.RESELLER_PENDING,
        suspended: ErrorCodes.RESELLER_SUSPENDED,
        rejected: ErrorCodes.FORBIDDEN,
      };

      return res.status(403).json({
        success: false,
        error: {
          code: codeMap[reseller.status] || ErrorCodes.RESELLER_NOT_ACTIVE,
          message: `Akun reseller Anda berstatus: ${reseller.status}.`,
        },
      });
    }

    // Attach reseller data ke request untuk digunakan controller
    (req as any).reseller = reseller;
    next();
  } catch (error) {
    next(error);
  }
};
