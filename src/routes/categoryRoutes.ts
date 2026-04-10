import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/categoryController';

const router = Router();

router.get('/', ctrl.getAllCategories);
router.get('/:id', ctrl.getCategoryById);
router.post('/', authenticateToken, ctrl.createCategory);
router.put('/:id', authenticateToken, ctrl.updateCategory);
router.delete('/:id', authenticateToken, ctrl.deleteCategory);

export default router;
