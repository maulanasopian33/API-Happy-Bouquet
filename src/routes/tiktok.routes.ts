import { Router } from 'express';
import { TiktokAdminController } from '../controllers/tiktokAdmin.controller';
import { TiktokUserController } from '../controllers/tiktokUser.controller';
import { tiktokVideoUploader } from '../middlewares/tiktokUploadMiddleware';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'Super Admin' || req.user.role === 'Admin')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
};

// Harus login untuk semua endpoint Tiktok
router.use(authenticateToken);

// --- Admin Routes ---
// Hanya role 'Admin' atau 'Super Admin' yang bisa mengakses
router.get('/admin/status', isAdmin, TiktokAdminController.getStatus);
router.get('/admin/connect', isAdmin, TiktokAdminController.getAuthUrl);
router.post('/admin/callback', isAdmin, TiktokAdminController.handleCallback);

// --- User Routes ---
// Semua user yang login bisa publish
router.post('/user/publish', tiktokVideoUploader.single('video'), TiktokUserController.publishVideo);

export default router;
