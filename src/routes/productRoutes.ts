import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { createUploader } from '../middlewares/uploadMiddleware';
import * as ctrl from '../controllers/productController';

const router = Router();

// GET  /api/products          — daftar semua produk
router.get('/', ctrl.getAllProducts);

// GET  /api/products/:id      — detail produk
router.get('/:id(\\d+)', ctrl.getProductById);

// GET  /api/products/slug/:slug — detail produk berdasarkan slug
router.get('/slug/:slug', ctrl.getProductBySlug);

// POST /api/products          — buat produk baru (admin)
router.post('/', authenticateToken, createUploader('products', 'product').single('photo'), ctrl.createProduct);

// PUT  /api/products/:id      — update produk (admin)
router.put('/:id', authenticateToken, createUploader('products', 'product').single('photo'), ctrl.updateProduct);

// DELETE /api/products/:id   — hapus produk (admin)
router.delete('/:id', authenticateToken, ctrl.deleteProduct);

// GET  /api/products/:id/cost-templates          — ambil template biaya
router.get('/:id/cost-templates', authenticateToken, ctrl.getCostTemplates);

// POST /api/products/:id/cost-templates          — tambah bulk template biaya
router.post('/:id/cost-templates', authenticateToken, ctrl.bulkAddCostTemplates);

// DELETE /api/products/:id/cost-templates/:templateId — hapus 1 template
router.delete('/:id/cost-templates/:templateId', authenticateToken, ctrl.deleteCostTemplate);

// POST /api/products/:id/channels                — set order channels (whatsapp, shopee, dll)
router.post('/:id/channels', authenticateToken, ctrl.setProductChannels);

export default router;
