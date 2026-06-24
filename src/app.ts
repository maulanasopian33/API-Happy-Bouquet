import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Trust proxy for express-rate-limit behind Passenger/LSWS/Nginx
// This is necessary for express-rate-limit to correctly identify user IPs
app.set('trust proxy', 1);

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti curl, Postman, atau server-to-server)
    if (!origin) return callback(null, true);
    
    // Jika masih development, izinkan semua origin
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Jika production, cek apakah origin terdaftar
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    return callback(new Error(`CORS Error: Origin ${origin} is not allowed.`), false);
  },
  credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (Re-enabled for production security)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});
app.use(limiter);

import authRoutes from './routes/authRoutes';
import materialRoutes from './routes/materialRoutes';
import adminRoutes from './routes/adminRoutes';
import customerRoutes from './routes/customerRoutes';
import logRoutes from './routes/logRoutes';
// ─── Modul Baru: Financial Management System ────────────────────
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import financialRoutes from './routes/financialRoutes';
import reportRoutes from './routes/reportRoutes';
import categoryRoutes from './routes/categoryRoutes';
import promoRoutes from './routes/promoRoutes';
import heroBannerRoutes from './routes/heroBannerRoutes';
import orderChannelRoutes from './routes/orderChannelRoutes';
import tiktokRoutes from './routes/tiktok.routes';
import analyticsRoutes from './routes/analyticsRoutes';
import resellerRoutes from './routes/resellerRoutes';
import resellerCatalogRoutes from './routes/resellerCatalogRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import notificationRoutes from './routes/notificationRoutes';
import path from 'path';

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

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Happy Bouquet API' });
});

import { errorHandler } from './middlewares/errorHandler';
app.use(errorHandler);

export default app;
