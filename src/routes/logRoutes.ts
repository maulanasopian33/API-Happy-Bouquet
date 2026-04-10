import { Router } from 'express';
import LogController from '../controllers/LogController';

const router = Router();

router.get('/', LogController.listLogs);
router.get('/:date', LogController.getLogByDate);
router.post('/', LogController.createFrontEndLog);

export default router;
