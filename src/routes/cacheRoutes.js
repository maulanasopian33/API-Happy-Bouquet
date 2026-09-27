const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const cacheController = require('../controllers/cacheController');

const router = Router();

// All cache routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// GET /api/cache/keys - List keys with pattern matching
router.get('/keys', cacheController.getKeys);

// GET /api/cache/stats - Get Redis stats
router.get('/stats', cacheController.getStats);

// GET /api/cache/keys/:key - Get value by key
router.get('/keys/:key', cacheController.getKey);

// POST /api/cache/keys - Set key-value with optional TTL
router.post('/keys', cacheController.setKey);

// GET /api/cache/keys/:key/ttl - Get TTL of key
router.get('/keys/:key/ttl', cacheController.getKeyTTL);

// POST /api/cache/keys/:key/expire - Set TTL for existing key
router.post('/keys/:key/expire', cacheController.setKeyExpiry);

// DELETE /api/cache/keys/:key - Delete key
router.delete('/keys/:key', cacheController.deleteKey);

// DELETE /api/cache/flush - Flush all cache (dangerous operation)
router.delete('/flush', cacheController.flushCache);

module.exports = router;