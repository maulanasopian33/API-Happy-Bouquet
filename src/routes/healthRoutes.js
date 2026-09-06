const { Router } = require('express');
const { getApiRoot, getHealth } = require('../controllers/healthController');

const router = Router();

router.get('/', getApiRoot);
router.get('/health', getHealth);

module.exports = router;
