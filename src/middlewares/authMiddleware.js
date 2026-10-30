"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const jwt = require('jsonwebtoken');
const errors = require('../constants/errors');

const AUTH_COOKIE_NAME = 'hb_token';

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  const token = (headerToken && headerToken !== 'null' ? headerToken : undefined) || cookieToken;

  if (!token) {
    return res.status(401).json({
      status: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
      data: null,
      error: {
        code: errors.ErrorCodes.UNAUTHORIZED,
        message: 'Akses ditolak. Token tidak ditemukan.',
      },
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new errors.AppError('JWT_SECRET tidak dikonfigurasi di environment.', 500, errors.ErrorCodes.INTERNAL_ERROR);
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      const code = err.name === 'TokenExpiredError' ? errors.ErrorCodes.TOKEN_EXPIRED : errors.ErrorCodes.TOKEN_INVALID;
      const message = err.name === 'TokenExpiredError' ? 'Token sudah kedaluwarsa.' : 'Token tidak valid.';
      return res.status(401).json({
        status: false,
        message,
        data: null,
        error: { code, message },
      });
    }
    req.user = decoded;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: false,
        message: 'Autentikasi diperlukan.',
        data: null,
        error: {
          code: errors.ErrorCodes.UNAUTHORIZED,
          message: 'Autentikasi diperlukan.',
        },
      });
    }

    try {
      // SEC-007: Validasi status dan role terkini user langsung dari database.
      // Mencegah akun yang sudah dihapus/didemote tetap mengakses endpoint admin via token JWT stateless.
      const db = require('../models');
      const freshUser = await db.User.findByPk(req.user.id, { attributes: ['id', 'role'] });

      if (!freshUser) {
        return res.status(401).json({
          status: false,
          message: 'Pengguna tidak ditemukan atau telah dinonaktifkan.',
          data: null,
          error: {
            code: errors.ErrorCodes.UNAUTHORIZED,
            message: 'Pengguna tidak ditemukan atau telah dinonaktifkan.',
          },
        });
      }

      const userRole = freshUser.role?.toLowerCase();
      const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

      if (!normalizedAllowed.includes(userRole)) {
        return res.status(403).json({
          status: false,
          message: `Akses ditolak. Memerlukan role: ${allowedRoles.join(', ')}.`,
          data: null,
          error: {
            code: errors.ErrorCodes.FORBIDDEN,
            message: `Akses ditolak. Memerlukan role: ${allowedRoles.join(', ')}.`,
          },
        });
      }

      req.user.role = freshUser.role;
      next();
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: 'Gagal memverifikasi izin pengguna.',
        data: null,
        error: {
          code: errors.ErrorCodes.INTERNAL_ERROR,
          message: err.message,
        },
      });
    }
  };
};

const requireActiveReseller = async (req, res, next) => {
  try {
    if (!req.user || req.user.role?.toLowerCase() !== 'reseller') {
      return res.status(403).json({
        status: false,
        message: 'Akses hanya untuk reseller.',
        data: null,
        error: {
          code: errors.ErrorCodes.FORBIDDEN,
          message: 'Akses hanya untuk reseller.',
        },
      });
    }

    const db = require('../models').default;

    const reseller = await db.Reseller.findOne({
      where: { user_id: req.user.id },
    });

    if (!reseller) {
      return res.status(404).json({
        status: false,
        message: 'Profil reseller tidak ditemukan.',
        data: null,
        error: {
          code: errors.ErrorCodes.NOT_FOUND,
          message: 'Profil reseller tidak ditemukan.',
        },
      });
    }

    if (reseller.status !== 'active') {
      const codeMap = {
        pending_review: errors.ErrorCodes.RESELLER_PENDING,
        suspended: errors.ErrorCodes.RESELLER_SUSPENDED,
        rejected: errors.ErrorCodes.FORBIDDEN,
      };

      return res.status(403).json({
        status: false,
        message: `Akun reseller Anda berstatus: ${reseller.status}.`,
        data: null,
        error: {
          code: codeMap[reseller.status] || errors.ErrorCodes.RESELLER_NOT_ACTIVE,
          message: `Akun reseller Anda berstatus: ${reseller.status}.`,
        },
      });
    }

    req.reseller = reseller;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  authenticateToken,
  authorizeRoles,
  requireActiveReseller,
};
