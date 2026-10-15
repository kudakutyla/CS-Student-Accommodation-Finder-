import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAdminReports, updateReportStatus } from '../controllers/report.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', getAdminReports);
router.patch('/:id/status', updateReportStatus);

export default router;
