const { Router } = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { createUploader } = require('../middlewares/uploadMiddleware');
const ctrl = require('../controllers/mediaController');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');
const upload = createUploader('media', 'media');

router.get('/', authenticateToken, adminOnly, ctrl.getAllMedia);
router.get('/:id', authenticateToken, adminOnly, ctrl.getMediaById);
router.post('/', authenticateToken, adminOnly, upload.single('file'), ctrl.uploadMedia);
router.put('/:id', authenticateToken, adminOnly, ctrl.updateMedia);
router.delete('/:id', authenticateToken, adminOnly, ctrl.deleteMedia);

module.exports = router;
