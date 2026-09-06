const { Router } = require('express');
const materialController = require('../controllers/materialController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { createUploader } = require('../middlewares/uploadMiddleware');

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

router.get('/', authenticateToken, adminOnly, materialController.getAllMaterials);
router.get('/:id', authenticateToken, adminOnly, materialController.getMaterialById);

// Protected routes (Create, Update, Delete)
router.post('/', authenticateToken, adminOnly, createUploader('materials', 'material').single('photo'), materialController.createMaterial);
router.put('/:id', authenticateToken, adminOnly, createUploader('materials', 'material').single('photo'), materialController.updateMaterial);
router.delete('/:id', authenticateToken, adminOnly, materialController.deleteMaterial);

module.exports = router;
