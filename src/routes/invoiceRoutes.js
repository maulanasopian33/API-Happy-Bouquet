const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const invoiceController = require('../controllers/invoiceController');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/:orderId', authenticateToken, adminOnly, invoiceController.getInvoiceByOrderId);
router.get('/:orderId/download', authenticateToken, adminOnly, invoiceController.downloadInvoice);

module.exports = router;
