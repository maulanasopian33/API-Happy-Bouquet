const { Router } = require('express');
const { GoogleBusinessController } = require('../controllers/googleBusiness.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = Router();

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
router.post('/locations/:locationV4Name/media', adminOnly, GoogleBusinessController.uploadPhoto);
router.delete('/media/:mediaName', adminOnly, GoogleBusinessController.deleteMedia);

// ─── PERFORMANCE ───────────────────────────────────────────────
router.get('/locations/:locationName/performance', adminOnly, GoogleBusinessController.fetchPerformance);

// ─── QUOTA ─────────────────────────────────────────────────────
router.get('/quota', adminOnly, GoogleBusinessController.getQuota);
router.post('/quota/reset', adminOnly, GoogleBusinessController.resetQuotaCounter);

module.exports = router;
