import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';
import * as ctrl from '../controllers/productController';

const router = Router();

// GET  /api/products          — daftar semua produk
router.get('/', ctrl.getAllProducts);

// GET  /api/products/:id      — detail produk
router.get('/:id', ctrl.getProductById);

// POST /api/products          — buat produk baru (admin)
router.post('/', authenticateToken, upload.single('photo'), ctrl.createProduct);

// PUT  /api/products/:id      — update produk (admin)
router.put('/:id', authenticateToken, upload.single('photo'), ctrl.updateProduct);

// DELETE /api/products/:id   — hapus produk (admin)
router.delete('/:id', authenticateToken, ctrl.deleteProduct);

// GET  /api/products/:id/cost-templates          — ambil template biaya
router.get('/:id/cost-templates', authenticateToken, ctrl.getCostTemplates);

// POST /api/products/:id/cost-templates          — tambah bulk template biaya
router.post('/:id/cost-templates', authenticateToken, ctrl.bulkAddCostTemplates);

// DELETE /api/products/:id/cost-templates/:templateId — hapus 1 template
router.delete('/:id/cost-templates/:templateId', authenticateToken, ctrl.deleteCostTemplate);

export default router;
