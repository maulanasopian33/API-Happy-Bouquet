import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/financialController';

const router = Router();

// GET  /api/financial/funds              — daftar semua kas
router.get('/funds', authenticateToken, ctrl.getAllFundAccounts);

// GET  /api/financial/funds/summary      — ringkasan saldo semua kas
router.get('/funds/summary', authenticateToken, ctrl.getFundsSummary);

// GET   /api/financial/funds/:id/transactions — riwayat transaksi kas tertentu
router.get('/funds/:id/transactions', authenticateToken, ctrl.getFundTransactions);

// Manual Transactions Entry (Advanced Finance)
// POST  /api/financial/transactions — buat transaksi manual
router.post('/transactions', authenticateToken, ctrl.createManualTransaction);

// PATCH /api/financial/transactions/:id — update transaksi manual
router.patch('/transactions/:id', authenticateToken, ctrl.updateManualTransaction);

// DELETE /api/financial/transactions/:id — hapus transaksi manual
router.delete('/transactions/:id', authenticateToken, ctrl.deleteManualTransaction);

export default router;
