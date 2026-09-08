const { Router } = require('express');
const { GoogleBusinessProductController } = require('../controllers/googleBusinessProduct.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = Router();
router.use(authenticateToken);
const adminOnly = authorizeRoles('admin', 'super admin', 'super_admin');

router.get('/products', adminOnly, GoogleBusinessProductController.list);
router.get('/products/categories', adminOnly, GoogleBusinessProductController.getCategories);
router.get('/products/:id', adminOnly, GoogleBusinessProductController.getById);
router.post('/products', adminOnly, GoogleBusinessProductController.create);
router.put('/products/:id', adminOnly, GoogleBusinessProductController.update);
router.delete('/products/:id', adminOnly, GoogleBusinessProductController.delete);
router.post('/products/:id/promote', adminOnly, GoogleBusinessProductController.promote);
router.post('/products/:id/unpromote', adminOnly, GoogleBusinessProductController.unpromote);

module.exports = router;
