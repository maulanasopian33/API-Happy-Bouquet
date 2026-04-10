import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/orderController';

const router = Router();

// GET  /api/orders                       — daftar semua order (admin)
router.get('/', authenticateToken, ctrl.getAllOrders);

// GET  /api/orders/:id                   — detail order
router.get('/:id', authenticateToken, ctrl.getOrderById);

// POST /api/orders                       — buat order baru
router.post('/', authenticateToken, ctrl.createOrder);

// PATCH /api/orders/:id/confirm-payment  — konfirmasi pembayaran (admin)
router.patch('/:id/confirm-payment', authenticateToken, ctrl.confirmPayment);

// PATCH /api/orders/:id/status           — update status produksi
router.patch('/:id/status', authenticateToken, ctrl.updateOrderStatus);

// PATCH /api/orders/:id/pay-worker-fees  — tandai upah pekerja lunas
router.patch('/:id/pay-worker-fees', authenticateToken, ctrl.payWorkerFees);

// GET  /api/orders/:id/profit            — kalkulasi profit order (dinamis)
router.get('/:id/profit', authenticateToken, ctrl.getOrderProfit);

// POST /api/orders/:id/allocate-profit   — alokasi profit ke kas (admin)
router.post('/:id/allocate-profit', authenticateToken, ctrl.allocateProfit);

export default router;
