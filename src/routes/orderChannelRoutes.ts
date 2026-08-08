import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/orderChannelController';

const router = Router();
const adminOnly = authorizeRoles('admin', 'super_admin');

// GET  /api/channels          — daftar semua channel
router.get('/', ctrl.getAllChannels);

// GET  /api/channels/:id      — detail channel
router.get('/:id', ctrl.getChannelById);

// POST /api/channels          — buat channel baru (admin)
router.post('/', authenticateToken, adminOnly, ctrl.createChannel);

// PUT  /api/channels/:id      — update channel (admin)
router.put('/:id', authenticateToken, adminOnly, ctrl.updateChannel);

// DELETE /api/channels/:id   — hapus channel (admin)
router.delete('/:id', authenticateToken, adminOnly, ctrl.deleteChannel);

export default router;
