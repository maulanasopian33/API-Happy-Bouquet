import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/heroBannerController';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/', ctrl.getAllBanners);
router.get('/:id', ctrl.getBannerById);
router.post('/', authenticateToken, adminOnly, ctrl.createBanner);
router.put('/:id', authenticateToken, adminOnly, ctrl.updateBanner);
router.delete('/:id', authenticateToken, adminOnly, ctrl.deleteBanner);

export default router;
