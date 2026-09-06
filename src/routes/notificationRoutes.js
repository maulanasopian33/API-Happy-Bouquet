const { Router } = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = Router();

router.get('/', authenticateToken, notificationController.getMyNotifications);

module.exports = router;
