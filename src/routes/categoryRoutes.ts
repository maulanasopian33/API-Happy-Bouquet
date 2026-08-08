import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/categoryController';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/', ctrl.getAllCategories);
router.get('/:id', ctrl.getCategoryById);
router.post('/', authenticateToken, adminOnly, ctrl.createCategory);
router.put('/:id', authenticateToken, adminOnly, ctrl.updateCategory);
router.delete('/:id', authenticateToken, adminOnly, ctrl.deleteCategory);

export default router;
