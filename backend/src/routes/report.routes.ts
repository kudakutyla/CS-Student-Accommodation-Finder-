import { Router } from 'express';
import { getMyReports } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/mine', authenticate, authorize('STUDENT'), getMyReports);

export default router;
