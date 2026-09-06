const { Router } = require('express');
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'super_admin'));

router.get('/', customerController.getAllCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
