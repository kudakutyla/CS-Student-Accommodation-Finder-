import { Router } from 'express';
import {
  getCampuses,
  getCampusById,
  createCampus,
  updateCampus,
  toggleCampusStatus,
} from '../controllers/campus.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public / Authenticated read
router.get('/', getCampuses);
router.get('/:id', getCampusById);

// Admin-only management
router.post('/', authenticate, authorize('ADMIN'), createCampus);
router.patch('/:id', authenticate, authorize('ADMIN'), updateCampus);
router.patch('/:id/status', authenticate, authorize('ADMIN'), toggleCampusStatus);

export default router;
