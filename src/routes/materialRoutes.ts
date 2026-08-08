import { Router } from 'express';
import * as materialController from '../controllers/materialController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import { createUploader } from '../middlewares/uploadMiddleware';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/', authenticateToken, adminOnly, materialController.getAllMaterials);
router.get('/:id', authenticateToken, adminOnly, materialController.getMaterialById);

// Protected routes (Create, Update, Delete)
router.post('/', authenticateToken, adminOnly, createUploader('materials', 'material').single('photo'), materialController.createMaterial);
router.put('/:id', authenticateToken, adminOnly, createUploader('materials', 'material').single('photo'), materialController.updateMaterial);
router.delete('/:id', authenticateToken, adminOnly, materialController.deleteMaterial);

export default router;
