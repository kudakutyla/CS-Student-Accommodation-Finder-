import { Router } from 'express';
import { getMyReportById, getMyReports } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/mine', authenticate, authorize('STUDENT'), getMyReports);
router.get('/mine/:id', authenticate, authorize('STUDENT'), getMyReportById);

export default router;
