const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const aiController = require('../controllers/aiController');

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// AI berbiaya per token — batasi lebih ketat daripada rate-limit global.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    status: false,
    message: 'Terlalu banyak permintaan AI. Coba lagi sebentar.',
    data: null,
    error: { code: 'RATE_LIMIT', message: 'Terlalu banyak permintaan AI. Coba lagi sebentar.' },
  },
});

router.get('/status', aiController.getStatus);
router.post('/generate', aiLimiter, aiController.generate);
router.post('/chat', aiLimiter, aiController.chat);

module.exports = router;
