const { Router } = require('express');
const LogController = require('../controllers/LogController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = Router();

// Baca daftar file & isi log = data server sensitif → admin only.
const adminOnly = authorizeRoles('admin', 'super_admin');
router.get('/', authenticateToken, adminOnly, LogController.listLogs);
router.get('/:date', authenticateToken, adminOnly, LogController.getLogByDate);

// POST tetap publik — dipakai frontend untuk mengirim log client.
// Beri rate limit ketat (30 req/menit) untuk mencegah disk exhaustion DoS.
const clientLogLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: false,
    message: 'Terlalu banyak log dikirim. Coba lagi sebentar.',
    data: null,
    error: { code: 'RATE_LIMIT', message: 'Terlalu banyak log dikirim. Coba lagi sebentar.' },
  },
});
router.post('/', clientLogLimiter, LogController.createFrontEndLog);

module.exports = router;
