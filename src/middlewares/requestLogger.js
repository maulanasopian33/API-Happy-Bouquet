const crypto = require('crypto');
const logger = require('../utils/logger');

const MAX_USER_AGENT = 200;

/**
 * Access log + korelasi request (X-Request-Id), dicatat sekali saat respons selesai.
 */
const requestLogger = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    if (req.originalUrl.startsWith('/public/')) return;

    const durationMs = Number((process.hrtime.bigint() - startedAt) / 1000000n);
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    logger.log(level, 'http_request', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status,
      durationMs,
      ip: req.ip,
      userId: req.user?.id || null,
      role: req.user?.role || null,
      bytes: Number(res.getHeader('content-length')) || 0,
      userAgent: String(req.headers['user-agent'] || '').slice(0, MAX_USER_AGENT),
    });
  });

  next();
};

module.exports = { requestLogger };
