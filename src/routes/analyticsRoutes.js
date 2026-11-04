const { Router } = require('express');
const {
  collectAnalytics,
  getAnalyticsOverview,
  getVisitorLogs,
  getBotLogs,
  getTrafficAnalytics,
  getConversionAnalytics,
  getPerformanceAnalytics,
} = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = Router();

// Endpoint publik dipanggil berkala oleh browser client (diberi rate limiter)
const collectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 120, // max 120 request per IP per menit (cukup untuk pageview, heartbeat, action)
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/collect', collectLimiter, collectAnalytics);

// Endpoint private untuk Panel Admin (Wajib login Admin/Super Admin)
router.get('/overview', authenticateToken, authorizeRoles('admin', 'super_admin'), getAnalyticsOverview);
router.get('/visitors', authenticateToken, authorizeRoles('admin', 'super_admin'), getVisitorLogs);
router.get('/bots', authenticateToken, authorizeRoles('admin', 'super_admin'), getBotLogs);

// Rute Analisis Lanjutan (CR-0005)
router.get('/traffic', authenticateToken, authorizeRoles('admin', 'super_admin'), getTrafficAnalytics);
router.get('/conversion', authenticateToken, authorizeRoles('admin', 'super_admin'), getConversionAnalytics);
router.get('/performance', authenticateToken, authorizeRoles('admin', 'super_admin'), getPerformanceAnalytics);

module.exports = router;
