import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as invoiceController from '../controllers/invoiceController';

const router = Router();

router.get('/:orderId', authenticateToken, invoiceController.getInvoiceByOrderId);
router.get('/:orderId/download', authenticateToken, invoiceController.downloadInvoice);

export default router;
