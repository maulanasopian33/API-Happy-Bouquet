import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ status: false, message: 'Access denied. Admins only.', data: null, error: null });
  }
  next();
};

router.use(authenticateToken);
router.use(isAdmin);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;
