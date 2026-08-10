import { Router } from 'express';
import { getApiRoot, getHealth } from '../controllers/healthController';

const router = Router();

router.get('/', getApiRoot);
router.get('/health', getHealth);

export default router;
