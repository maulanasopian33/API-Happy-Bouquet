const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/mediaCreatorController');

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'super_admin'));

// Render memakai CPU & RAM — batasi lebih ketat daripada rate-limit global.
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    status: false,
    message: 'Terlalu banyak permintaan generate. Coba lagi sebentar.',
    data: null,
    error: { code: 'RATE_LIMIT', message: 'Terlalu banyak permintaan generate. Coba lagi sebentar.' },
  },
});

// Template
router.get('/templates', ctrl.getTemplates);
router.post('/templates', ctrl.createTemplate);
router.put('/templates/:id', ctrl.updateTemplate);
router.delete('/templates/:id', ctrl.deleteTemplate);

// Project
router.get('/projects', ctrl.getProjects);
router.post('/projects', ctrl.createProject);
router.get('/projects/:id', ctrl.getProject);
router.put('/projects/:id', ctrl.updateProject);
router.delete('/projects/:id', ctrl.deleteProject);

// Generate & output
router.post('/projects/:id/generate', generateLimiter, ctrl.generateOutput);
router.delete('/projects/:id/outputs/:outputId', ctrl.deleteOutput);

module.exports = router;
