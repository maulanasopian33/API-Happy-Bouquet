import { Router } from 'express';
import * as materialController from '../controllers/materialController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { createUploader } from '../middlewares/uploadMiddleware';

const router = Router();

// Public route (optional: might want to restrict this too)
router.get('/', authenticateToken, materialController.getAllMaterials);
router.get('/:id', authenticateToken, materialController.getMaterialById);

// Protected routes (Create, Update, Delete)
router.post('/', authenticateToken, createUploader('materials', 'material').single('photo'), materialController.createMaterial);
router.put('/:id', authenticateToken, createUploader('materials', 'material').single('photo'), materialController.updateMaterial);
router.delete('/:id', authenticateToken, materialController.deleteMaterial);

export default router;
