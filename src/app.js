const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();

// Trust proxy for express-rate-limit behind Passenger/LSWS/Nginx
app.set('trust proxy', 1);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const isProduction = process.env.NODE_ENV === 'production';

console.log('[CORS] Environment:', process.env.NODE_ENV);
console.log('[CORS] Allowed origins:', allowedOrigins.length > 0 ? allowedOrigins : '(none — all origins will be blocked in production)');

// ─── CORS Origin Checker ────────────────────────────────────────
const isOriginAllowed = (origin) => {
  if (!origin) return true; // tanpa origin (curl, Postman, server-to-server)
  if (!isProduction) return true; // development: izinkan semua
  if (allowedOrigins.length === 0) return false; // production tanpa config: tolak
  return allowedOrigins.includes(origin);
};

// ─── EXPLICIT OPTIONS HANDLER (paling depan!) ───────────────────
// Handle preflight SEBELUM middleware lain (helmet, rate-limit, dll)
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') return next();

  const origin = req.headers.origin;
  const allowed = isOriginAllowed(origin);

  console.log(`[CORS] OPTIONS ${req.path} - origin: ${origin} - allowed: ${allowed}`);

  // Build headers object
  const headers = {};
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token';
    headers['Access-Control-Max-Age'] = '86400';
  }

  // Gunakan writeHead untuk memastikan headers terkirim
  res.writeHead(204, headers);
  res.end();
});

// ─── CORS Middleware (untuk non-OPTIONS requests) ───────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});
app.use(limiter);

const { csrfGuard } = require('./middlewares/csrfMiddleware');
app.use(csrfGuard);

const authRoutes = require('./routes/authRoutes');
const materialRoutes = require('./routes/materialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const logRoutes = require('./routes/logRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const financialRoutes = require('./routes/financialRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const promoRoutes = require('./routes/promoRoutes');
const heroBannerRoutes = require('./routes/heroBannerRoutes');
const orderChannelRoutes = require('./routes/orderChannelRoutes');
const tiktokRoutes = require('./routes/tiktok.routes');
const googleBusinessRoutes = require('./routes/googleBusiness.routes');
const googleBusinessProductRoutes = require('./routes/googleBusinessProduct.routes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const resellerRoutes = require('./routes/resellerRoutes');
const resellerCatalogRoutes = require('./routes/resellerCatalogRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const healthRoutes = require('./routes/healthRoutes');
const path = require('path');

// ─── Root API Info & Health Check ───────────────────────────────
app.use('/', healthRoutes);

app.use('/public', express.static(path.join(__dirname, '../public')));

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/banners', heroBannerRoutes);
app.use('/api/channels', orderChannelRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/google-business', googleBusinessRoutes);
app.use('/api/google-business', googleBusinessProductRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api', resellerRoutes);
app.use('/api/catalog', resellerCatalogRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);

// ─── 404 Handler ────────────────────────────────────────────────
app.use((req, res) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(404).json({
    status: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} tidak tersedia.`,
    },
  });
});

// ─── Error Handler ──────────────────────────────────────────────
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
