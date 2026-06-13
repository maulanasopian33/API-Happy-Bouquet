import { Router } from 'express';
import { collectAnalytics } from '../controllers/analyticsController';
import rateLimit from 'express-rate-limit';

const router = Router();

// Endpoint ini dipanggil terus menerus oleh client, kita beri rate limit ketat per IP
const collectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 60, // max 60 request per IP per menit
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/collect', collectLimiter, collectAnalytics);

export default router;
