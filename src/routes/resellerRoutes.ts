import { Router } from 'express';
import { authenticateToken, authorizeRoles, requireActiveReseller } from '../middlewares/authMiddleware';
import { createUploader } from '../middlewares/uploadMiddleware';
import * as authCtrl from '../controllers/resellerAuthController';
import * as catalogCtrl from '../controllers/resellerCatalogController';
import * as clientCtrl from '../controllers/resellerClientController';
import * as orderCtrl from '../controllers/resellerOrderController';
import * as earningCtrl from '../controllers/resellerEarningController';
import * as adminCtrl from '../controllers/resellerAdminController';

const router = Router();

// ─── Public Reseller Route ─────────────────────────────────────────
router.post('/reseller/register', authCtrl.register);

// ─── Authenticated Reseller Routes ─────────────────────────────────
// All routes below require login and active reseller status
const resellerMiddleware = [authenticateToken, requireActiveReseller];

router.get('/reseller/profile', resellerMiddleware, authCtrl.getProfile);
router.put('/reseller/profile', resellerMiddleware, authCtrl.updateProfile);
router.get('/reseller/dashboard', resellerMiddleware, authCtrl.getDashboard);

// Catalog Settings
router.get('/reseller/catalog-settings', resellerMiddleware, catalogCtrl.getSettings);
router.put('/reseller/catalog-settings', resellerMiddleware, catalogCtrl.updateSettings);
router.get('/reseller/whatsapp-template', resellerMiddleware, catalogCtrl.getTemplate);
router.put('/reseller/whatsapp-template', resellerMiddleware, catalogCtrl.updateTemplate);

// Client CRM Repository
router.get('/reseller/clients', resellerMiddleware, clientCtrl.listClients);
router.post('/reseller/clients', resellerMiddleware, clientCtrl.createClient);
router.get('/reseller/clients/:id(\\d+)', resellerMiddleware, clientCtrl.getClient);
router.put('/reseller/clients/:id(\\d+)', resellerMiddleware, clientCtrl.updateClient);
router.delete('/reseller/clients/:id(\\d+)', resellerMiddleware, clientCtrl.deleteClient);

// Order Management & Upload Proof
router.get('/reseller/orders', resellerMiddleware, orderCtrl.listOrders);
router.post('/reseller/orders', resellerMiddleware, orderCtrl.createOrder);
router.get('/reseller/orders/:id(\\d+)', resellerMiddleware, orderCtrl.getOrder);
router.post(
  '/reseller/orders/:id(\\d+)/upload-payment',
  resellerMiddleware,
  createUploader('payments', 'pay').single('payment_proof'),
  orderCtrl.uploadProof
);

// Earnings reports
router.get('/reseller/earnings', resellerMiddleware, earningCtrl.listEarnings);
router.get('/reseller/earnings/summary', resellerMiddleware, earningCtrl.getSummary);

// ─── Admin Reseller Management Routes ──────────────────────────────
// All routes below require login and admin role
const adminMiddleware = [authenticateToken, authorizeRoles('admin', 'super_admin')];

router.get('/admin/resellers', adminMiddleware, adminCtrl.listResellers);
router.get('/admin/resellers/:id(\\d+)', adminMiddleware, adminCtrl.getReseller);
router.patch('/admin/resellers/:id(\\d+)/approve', adminMiddleware, adminCtrl.approve);
router.patch('/admin/resellers/:id(\\d+)/reject', adminMiddleware, adminCtrl.reject);
router.patch('/admin/resellers/:id(\\d+)/suspend', adminMiddleware, adminCtrl.suspend);
router.patch('/admin/resellers/:id(\\d+)/tier', adminMiddleware, adminCtrl.changeTier);
router.post('/admin/reseller-tier-prices', adminMiddleware, adminCtrl.setTierPrices);
router.get('/admin/reseller-tier-prices/:productId(\\d+)', adminMiddleware, adminCtrl.getTierPrices);
router.patch('/admin/products/:id(\\d+)/resellable', adminMiddleware, adminCtrl.toggleResellable);

export default router;
