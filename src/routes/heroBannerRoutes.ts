import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/heroBannerController';

const router = Router();

router.get('/', ctrl.getAllBanners);
router.get('/:id', ctrl.getBannerById);
router.post('/', authenticateToken, ctrl.createBanner);
router.put('/:id', authenticateToken, ctrl.updateBanner);
router.delete('/:id', authenticateToken, ctrl.deleteBanner);

export default router;
