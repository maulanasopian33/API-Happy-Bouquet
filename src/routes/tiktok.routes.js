const { Router } = require('express');
const { TiktokAdminController } = require('../controllers/tiktokAdmin.controller');
const { TiktokUserController } = require('../controllers/tiktokUser.controller');
const { tiktokVideoUploader } = require('../middlewares/tiktokUploadMiddleware');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { errorResponse } = require('../utils/response');

const router = Router();

// TikTok hanya implementasi mock (belum terintegrasi API resmi).
// Di production rute ditolak agar data mock tidak bocor ke live.
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return errorResponse(res, 'Fitur TikTok belum tersedia di production', null, 403);
  }
  next();
});

// Harus login untuk semua endpoint Tiktok
router.use(authenticateToken);

// --- Admin Routes ---
// Hanya role 'admin' / 'super admin' yang bisa mengakses
router.get('/admin/status', authorizeRoles('admin', 'super admin', 'super_admin'), TiktokAdminController.getStatus);
router.get('/admin/connect', authorizeRoles('admin', 'super admin', 'super_admin'), TiktokAdminController.getAuthUrl);
router.post('/admin/callback', authorizeRoles('admin', 'super admin', 'super_admin'), TiktokAdminController.handleCallback);

// --- User Routes ---
// Semua user yang login bisa publish
router.post('/user/publish', tiktokVideoUploader.single('video'), TiktokUserController.publishVideo);

module.exports = router;
