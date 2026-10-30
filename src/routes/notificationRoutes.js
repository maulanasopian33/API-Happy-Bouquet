const { Router } = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = Router();

// Endpoint SSE realtime stream (khusus user terautentikasi)
router.get('/stream', authenticateToken, notificationController.subscribeStream);

// History notifikasi
router.get('/', authenticateToken, notificationController.getMyNotifications);

module.exports = router;
