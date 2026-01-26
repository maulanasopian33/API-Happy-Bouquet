import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Middleware to check if user is admin (simple check, can be extracted to middleware)
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ status: false, message: 'Access denied. Admins only.', data: null, error: null });
  }
  next();
};

router.use(authenticateToken);
router.use(isAdmin);

router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.get('/:id', adminController.getAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

export default router;
