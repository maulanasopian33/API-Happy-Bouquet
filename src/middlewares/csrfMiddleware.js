const { AUTH_COOKIE_NAME } = require('./authMiddleware');
const { ErrorCodes } = require('../constants/errors');
const { applyCorsHeaders } = require('../utils/cors');

const csrfGuard = (req, res, next) => {
  // OPTIONS (preflight) harus selalu lolos — CORS sudah handle
  if (req.method === 'OPTIONS') {
    return next();
  }

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
    // Terapkan CORS headers hanya jika origin diizinkan
    applyCorsHeaders(res, req.headers.origin);
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
