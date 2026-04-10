import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Trust proxy for express-rate-limit behind Passenger/LSWS
app.set('trust proxy', 1);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
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

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Happy Bouquet API' });
});

export default app;
