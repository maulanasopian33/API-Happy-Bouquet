const os = require('os');
const { successResponse } = require('../utils/response');

const APP_ENDPOINTS = [
  '/api/auth',
  '/api/materials',
  '/api/admins',
  '/api/customers',
  '/api/logs',
  '/api/products',
  '/api/orders',
  '/api/financial',
  '/api/reports',
  '/api/categories',
  '/api/promos',
  '/api/banners',
  '/api/channels',
  '/api/tiktok',
  '/api/v1/analytics',
  '/api/catalog',
  '/api/invoices',
  '/api/notifications',
  '/api/reseller',
  '/public',
];

const getApiRoot = (_req, res) => {
  const pkg = require('../../package.json');
  const data = {
    name: pkg.name || 'api-happybouquet',
    version: pkg.version || '0.0.0',
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    endpoints: APP_ENDPOINTS,
    timestamp: new Date().toISOString(),
  };
  return successResponse(res, 'Selamat datang di Happy Bouquet API', data);
};

const getHealth = (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const memory = process.memoryUsage();

  // Di production, sembunyikan fingerprinting hardware & memori mentah
  const data = isProd ? {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: 'production',
    timestamp: new Date().toISOString(),
  } : {
    status: 'ok',
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    cpus: os.cpus().length,
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
    },
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };

  res.set('Cache-Control', 'no-store');
  return successResponse(res, 'Server sehat', data);
};

module.exports = {
  getApiRoot,
  getHealth,
};
