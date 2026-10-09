import { Router } from 'express';
import {
  getPendingListings,
  getAdminListings,
  approveListing,
  rejectListing,
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  getAdminAuditLogs,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Strictly ADMIN-only
router.use(authenticate, authorize('ADMIN'));

router.get('/listings/pending', getPendingListings);
router.get('/listings', getAdminListings);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', rejectListing);
router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id', updateAdminUser);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
