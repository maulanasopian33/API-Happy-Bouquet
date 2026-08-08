import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/promoController';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/', ctrl.getAllPromos);
router.get('/:id', ctrl.getPromoById);
router.post('/', authenticateToken, adminOnly, ctrl.createPromo);
router.put('/:id', authenticateToken, adminOnly, ctrl.updatePromo);
router.delete('/:id', authenticateToken, adminOnly, ctrl.deletePromo);

export default router;
