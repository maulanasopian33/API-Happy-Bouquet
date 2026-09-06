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
// Beri rate limit tersendiri agar tidak terlalu membebani (frontend bisa spam log).
const clientLogLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
router.post('/', clientLogLimiter, LogController.createFrontEndLog);

module.exports = router;
