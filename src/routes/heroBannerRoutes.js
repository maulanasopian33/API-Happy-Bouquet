const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/heroBannerController');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/', ctrl.getAllBanners);
router.get('/:id', ctrl.getBannerById);
router.post('/', authenticateToken, adminOnly, ctrl.createBanner);
router.put('/:id', authenticateToken, adminOnly, ctrl.updateBanner);
router.delete('/:id', authenticateToken, adminOnly, ctrl.deleteBanner);

module.exports = router;
