import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/promoController';

const router = Router();

router.get('/', ctrl.getAllPromos);
router.get('/:id', ctrl.getPromoById);
router.post('/', authenticateToken, ctrl.createPromo);
router.put('/:id', authenticateToken, ctrl.updatePromo);
router.delete('/:id', authenticateToken, ctrl.deletePromo);

export default router;
