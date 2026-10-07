import { Router } from 'express';
import {
  getCampuses,
  getAdminCampuses,
  getCampusById,
  getInstitutions,
  getAdminInstitutions,
  getInstitutionSuggestions,
  createInstitution,
  updateInstitution,
  createCampus,
  updateCampus,
  toggleCampusStatus,
} from '../controllers/campus.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public / Authenticated read
router.get('/institutions/suggestions', authenticate, authorize('ADMIN'), getInstitutionSuggestions);
router.get('/institutions/manage', authenticate, authorize('ADMIN'), getAdminInstitutions);
router.get('/institutions', getInstitutions);
router.post('/institutions', authenticate, authorize('ADMIN'), createInstitution);
router.patch('/institutions/:id', authenticate, authorize('ADMIN'), updateInstitution);
router.get('/manage', authenticate, authorize('ADMIN'), getAdminCampuses);
router.get('/', getCampuses);
router.get('/:id', getCampusById);

// Admin-only management
router.post('/', authenticate, authorize('ADMIN'), createCampus);
router.patch('/:id', authenticate, authorize('ADMIN'), updateCampus);
router.patch('/:id/status', authenticate, authorize('ADMIN'), toggleCampusStatus);

export default router;
