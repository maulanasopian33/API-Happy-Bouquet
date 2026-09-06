const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/financialController');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

// GET  /api/financial/funds              — daftar semua kas (admin)
router.get('/funds', authenticateToken, adminOnly, ctrl.getAllFundAccounts);

// GET  /api/financial/funds/summary      — ringkasan saldo semua kas (admin)
router.get('/funds/summary', authenticateToken, adminOnly, ctrl.getFundsSummary);

// GET   /api/financial/funds/:id/transactions — riwayat transaksi kas tertentu (admin)
router.get('/funds/:id/transactions', authenticateToken, adminOnly, ctrl.getFundTransactions);

// Manual Transactions Entry (Advanced Finance)
// POST  /api/financial/transactions — buat transaksi manual (admin)
router.post('/transactions', authenticateToken, adminOnly, ctrl.createManualTransaction);

// PATCH /api/financial/transactions/:id — update transaksi manual (admin)
router.patch('/transactions/:id', authenticateToken, adminOnly, ctrl.updateManualTransaction);

// DELETE /api/financial/transactions/:id — hapus transaksi manual (admin)
router.delete('/transactions/:id', authenticateToken, adminOnly, ctrl.deleteManualTransaction);

module.exports = router;
