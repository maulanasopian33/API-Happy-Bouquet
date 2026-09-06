const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();

// Trust proxy for express-rate-limit behind Passenger/LSWS/Nginx
// This is necessary for express-rate-limit to correctly identify user IPs
app.set('trust proxy', 1);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (curl, Postman, server-to-server, mobile apps)
    if (!origin) return callback(null, true);

    // Development: izinkan semua origin
    if (!isProduction) {
      return callback(null, true);
    }

    // Production: cek whitelist
    if (allowedOrigins.length === 0) {
      // Tidak ada CORS_ORIGINS yang di-set — tolak semua browser origin
      console.warn('[CORS] No CORS_ORIGINS configured in production — rejecting browser origin:', origin);
      return callback(null, false);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('[CORS] Blocked origin:', origin);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
  ],
  credentials: true,
  maxAge: 86400, // 24 jam preflight cache
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting (Re-enabled for production security)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});
app.use(limiter);

const { csrfGuard } = require('./middlewares/csrfMiddleware');
// Proteksi CSRF untuk request berbasis cookie (panel). Bearer-only & publik di-bypass.
app.use(csrfGuard);

const authRoutes = require('./routes/authRoutes');
const materialRoutes = require('./routes/materialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const logRoutes = require('./routes/logRoutes');
// ─── Modul Baru: Financial Management System ────────────────────
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const financialRoutes = require('./routes/financialRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const promoRoutes = require('./routes/promoRoutes');
const heroBannerRoutes = require('./routes/heroBannerRoutes');
const orderChannelRoutes = require('./routes/orderChannelRoutes');
const tiktokRoutes = require('./routes/tiktok.routes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const resellerRoutes = require('./routes/resellerRoutes');
const resellerCatalogRoutes = require('./routes/resellerCatalogRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const path = require('path');

// ─── Root API Info & Health Check (dipasang paling depan) ───────────
app.use('/', healthRoutes);

app.use('/public', express.static(path.join(__dirname, '../public')));

// ─── Routes Existing (tidak diubah) ─────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/logs', logRoutes);

// ─── Routes Baru: Financial Management System ───────────────────
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/banners', heroBannerRoutes);
app.use('/api/channels', orderChannelRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// ─── Routes Baru: Reseller & Catalog ───────────────────────────
app.use('/api', resellerRoutes);
app.use('/api/catalog', resellerCatalogRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);

const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
