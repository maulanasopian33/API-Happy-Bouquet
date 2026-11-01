const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/orderController');
const publicCtrl = require('../controllers/publicOrderController');
const rateLimit = require('express-rate-limit');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

// Rate limiter untuk endpoint publik (tanpa auth)
const publicOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // maks 10 pesanan per IP per 15 menit
  message: { error: 'Terlalu banyak permintaan, coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 20,
  message: { error: 'Terlalu banyak permintaan, coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/orders/public                — pesanan dari web storefront (tanpa auth)
router.post('/public', publicOrderLimiter, publicCtrl.createPublicOrder);

// GET  /api/orders/track/:orderNumber    — cek status pesanan (tanpa auth, data publik)
router.get('/track/:orderNumber', trackingLimiter, publicCtrl.getPublicOrderTracking);

// GET  /api/orders                       — daftar semua order (admin)
router.get('/', authenticateToken, adminOnly, ctrl.getAllOrders);

// GET  /api/orders/:id                   — detail order
router.get('/:id', authenticateToken, adminOnly, ctrl.getOrderById);

// POST /api/orders                       — buat order baru
router.post('/', authenticateToken, adminOnly, ctrl.createOrder);

// PATCH /api/orders/:id/confirm-payment  — konfirmasi pembayaran (admin)
router.patch('/:id/confirm-payment', authenticateToken, adminOnly, ctrl.confirmPayment);

// PATCH /api/orders/:id/status           — update status produksi
router.patch('/:id/status', authenticateToken, adminOnly, ctrl.updateOrderStatus);

// PATCH /api/orders/:id/pay-worker-fees  — tandai upah pekerja lunas
router.patch('/:id/pay-worker-fees', authenticateToken, adminOnly, ctrl.payWorkerFees);

// GET  /api/orders/:id/profit            — kalkulasi profit order (dinamis)
router.get('/:id/profit', authenticateToken, adminOnly, ctrl.getOrderProfit);

// POST /api/orders/:id/allocate-profit   — alokasi profit ke kas (admin)
router.post('/:id/allocate-profit', authenticateToken, adminOnly, ctrl.allocateProfit);

module.exports = router;
