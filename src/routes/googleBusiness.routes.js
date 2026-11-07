const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { GoogleBusinessController } = require('../controllers/googleBusiness.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { createMemoryUploader } = require('../middlewares/uploadMiddleware');
const { errorResponse } = require('../utils/response');

const router = Router();
const photoUpload = createMemoryUploader();

// Upload menyentuh kuota Google — batasi agar tidak boros.
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    status: false,
    message: 'Terlalu banyak upload foto. Coba lagi sebentar.',
    data: null,
    error: { code: 'RATE_LIMIT', message: 'Terlalu banyak upload foto. Coba lagi sebentar.' },
  },
});

const handlePhotoUpload = (req, res, next) => {
  photoUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Ukuran file maksimal 2 MB'
      : err.message || 'File tidak valid';
    return errorResponse(res, message, null, 400);
  });
};

// Semua endpoint GBP butuh login
router.use(authenticateToken);
const adminOnly = authorizeRoles('admin', 'super admin', 'super_admin');

// ─── AUTH ──────────────────────────────────────────────────────
router.get('/status', adminOnly, GoogleBusinessController.getStatus);
router.get('/connect', adminOnly, GoogleBusinessController.getAuthUrl);
router.get('/callback', adminOnly, GoogleBusinessController.handleCallback);
router.post('/disconnect', adminOnly, GoogleBusinessController.disconnect);

// ─── ACCOUNTS & LOCATIONS ──────────────────────────────────────
router.get('/accounts', adminOnly, GoogleBusinessController.listAccounts);
router.get('/locations', adminOnly, GoogleBusinessController.listLocations);
router.get('/locations/:locationName/detail', adminOnly, GoogleBusinessController.getLocationDetail);
router.patch('/locations/:locationName', adminOnly, GoogleBusinessController.updateLocation);
router.patch('/locations/:locationName/hours', adminOnly, GoogleBusinessController.updateHours);

// ─── REVIEWS ───────────────────────────────────────────────────
router.get('/locations/:locationV4Name/reviews', adminOnly, GoogleBusinessController.listReviews);
router.put('/reviews/:reviewName/reply', adminOnly, GoogleBusinessController.replyReview);
router.delete('/reviews/:reviewName/reply', adminOnly, GoogleBusinessController.deleteReply);

// ─── POSTS ─────────────────────────────────────────────────────
router.get('/locations/:locationV4Name/posts', adminOnly, GoogleBusinessController.listPosts);
router.post('/locations/:locationV4Name/posts', adminOnly, GoogleBusinessController.createPost);
router.delete('/posts/:postName', adminOnly, GoogleBusinessController.deletePost);

// ─── MEDIA (PHOTOS) ───────────────────────────────────────────
router.get('/locations/:locationV4Name/media', adminOnly, GoogleBusinessController.listMedia);
router.post('/locations/:locationV4Name/media', adminOnly, uploadLimiter, handlePhotoUpload, GoogleBusinessController.uploadPhoto);
router.get('/media/:mediaName', adminOnly, GoogleBusinessController.getMedia);
router.patch('/media/:mediaName', adminOnly, GoogleBusinessController.updateMedia);
router.delete('/media/:mediaName', adminOnly, GoogleBusinessController.deleteMedia);

// ─── PERFORMANCE ───────────────────────────────────────────────
router.get('/locations/:locationName/performance', adminOnly, GoogleBusinessController.fetchPerformance);

// ─── QUOTA ─────────────────────────────────────────────────────
router.get('/quota', adminOnly, GoogleBusinessController.getQuota);
router.post('/quota/reset', adminOnly, GoogleBusinessController.resetQuotaCounter);

module.exports = router;
