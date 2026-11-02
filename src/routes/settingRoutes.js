const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/settingController');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

// Publik: storefront (Nuxt) membaca data toko tanpa token
router.get('/', ctrl.getSettings);
router.put('/', authenticateToken, adminOnly, ctrl.updateSettings);

module.exports = router;
