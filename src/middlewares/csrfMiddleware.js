"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { AUTH_COOKIE_NAME } = require('./authMiddleware');
const { ErrorCodes } = require('../constants/errors');

const csrfGuard = (req, res, next) => {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];

  if (!cookieToken) {
    return next();
  }

  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!mutating) {
    return next();
  }

  const xRequestedWith = req.headers['x-requested-with'];
  if (!xRequestedWith || String(xRequestedWith).trim() === '') {
    return res.status(403).json({
      status: false,
      message: 'CSRF: header X-Requested-With wajib disertakan.',
      data: null,
      error: {
        code: ErrorCodes.FORBIDDEN,
        message: 'CSRF: header X-Requested-With wajib disertakan.',
      },
    });
  }

  next();
};

module.exports = { csrfGuard };
