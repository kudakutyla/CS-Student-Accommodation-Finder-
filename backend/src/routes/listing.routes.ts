import { Router } from 'express';
import {
  createListing,
  getMyListings,
  getPublicListings,
  getListingById,
  updateListing,
  deleteListing,
} from '../controllers/listing.controller';
import {
  authenticate,
  authorize,
  requireVerifiedLandlord,
} from '../middleware/auth.middleware';

const router = Router();

// Public listings search
router.get('/', getPublicListings);

// Landlord's own listings (Must come before /:id)
router.get('/my', authenticate, authorize('LANDLORD'), getMyListings);

// Specific listing detail (public or authenticated)
router.get('/:id', getListingById);

// Landlord listing creation (strictly requires verified landlord)
router.post(
  '/',
  authenticate,
  authorize('LANDLORD'),
  requireVerifiedLandlord,
  createListing
);

// Listing management
router.patch('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), updateListing);
router.delete('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), deleteListing);

export default router;
