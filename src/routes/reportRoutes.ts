import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/reportController';

const router = Router();

// GET  /api/reports/summary             — laporan keuangan global
router.get('/summary', authenticateToken, ctrl.getGlobalSummary);

// GET  /api/reports/orders              — daftar order dengan kalkulasi profit
router.get('/orders', authenticateToken, ctrl.getOrdersProfitList);

// GET  /api/reports/orders/:id          — laporan keuangan per order
router.get('/orders/:id', authenticateToken, ctrl.getOrderFinancialReport);

// GET  /api/reports/balance-sheet — laporan neraca keuangan (Baru)
router.get('/balance-sheet', authenticateToken, ctrl.getBalanceSheet);

export default router;
