import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/orderController';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

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

export default router;
