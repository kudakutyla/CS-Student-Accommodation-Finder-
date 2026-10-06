import { Router } from 'express';
import { createReport } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/listings/:id/reports', authenticate, authorize('STUDENT'), createReport);

export default router;
