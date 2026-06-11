import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/orderChannelController';

const router = Router();

// GET  /api/channels          — daftar semua channel
router.get('/', ctrl.getAllChannels);

// GET  /api/channels/:id      — detail channel
router.get('/:id', ctrl.getChannelById);

// POST /api/channels          — buat channel baru (admin)
router.post('/', authenticateToken, ctrl.createChannel);

// PUT  /api/channels/:id      — update channel (admin)
router.put('/:id', authenticateToken, ctrl.updateChannel);

// DELETE /api/channels/:id   — hapus channel (admin)
router.delete('/:id', authenticateToken, ctrl.deleteChannel);

export default router;
