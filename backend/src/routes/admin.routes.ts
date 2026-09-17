import { Router } from 'express';
import {
  getPendingListings,
  approveListing,
  rejectListing,
  getAdminStats,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Strictly ADMIN-only
router.use(authenticate, authorize('ADMIN'));

router.get('/listings/pending', getPendingListings);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', rejectListing);
router.get('/stats', getAdminStats);

export default router;
