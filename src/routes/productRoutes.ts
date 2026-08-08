import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import { createUploader } from '../middlewares/uploadMiddleware';
import * as ctrl from '../controllers/productController';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

// GET  /api/products          — daftar semua produk
router.get('/', ctrl.getAllProducts);

// GET  /api/products/:id      — detail produk
router.get('/:id(\\d+)', ctrl.getProductById);

// GET  /api/products/slug/:slug — detail produk berdasarkan slug
router.get('/slug/:slug', ctrl.getProductBySlug);

// POST /api/products          — buat produk baru (admin)
router.post('/', authenticateToken, adminOnly, createUploader('products', 'product').single('photo'), ctrl.createProduct);

// PUT  /api/products/:id      — update produk (admin)
router.put('/:id', authenticateToken, adminOnly, createUploader('products', 'product').single('photo'), ctrl.updateProduct);

// DELETE /api/products/:id   — hapus produk (admin)
router.delete('/:id', authenticateToken, adminOnly, ctrl.deleteProduct);

// GET  /api/products/:id/cost-templates          — ambil template biaya (admin)
router.get('/:id/cost-templates', authenticateToken, adminOnly, ctrl.getCostTemplates);

// POST /api/products/:id/cost-templates          — tambah bulk template biaya (admin)
router.post('/:id/cost-templates', authenticateToken, adminOnly, ctrl.bulkAddCostTemplates);

// DELETE /api/products/:id/cost-templates/:templateId — hapus 1 template (admin)
router.delete('/:id/cost-templates/:templateId', authenticateToken, adminOnly, ctrl.deleteCostTemplate);

// POST /api/products/:id/channels                — set order channels (admin)
router.post('/:id/channels', authenticateToken, adminOnly, ctrl.setProductChannels);

export default router;
