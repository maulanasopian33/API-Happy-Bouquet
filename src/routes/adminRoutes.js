const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'super_admin'));

router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.get('/:id', adminController.getAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
