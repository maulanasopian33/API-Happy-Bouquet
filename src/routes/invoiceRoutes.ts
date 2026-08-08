import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import * as invoiceController from '../controllers/invoiceController';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/:orderId', authenticateToken, adminOnly, invoiceController.getInvoiceByOrderId);
router.get('/:orderId/download', authenticateToken, adminOnly, invoiceController.downloadInvoice);

export default router;
