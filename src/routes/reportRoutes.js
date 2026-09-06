const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/reportController');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

// GET  /api/reports/summary             — laporan keuangan global (admin)
router.get('/summary', authenticateToken, adminOnly, ctrl.getGlobalSummary);

// GET  /api/reports/orders              — daftar order dengan kalkulasi profit (admin)
router.get('/orders', authenticateToken, adminOnly, ctrl.getOrdersProfitList);

// GET  /api/reports/orders/:id          — laporan keuangan per order (admin)
router.get('/orders/:id', authenticateToken, adminOnly, ctrl.getOrderFinancialReport);

// GET  /api/reports/balance-sheet — laporan neraca keuangan (admin)
router.get('/balance-sheet', authenticateToken, adminOnly, ctrl.getBalanceSheet);

module.exports = router;
