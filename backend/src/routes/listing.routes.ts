import { Router } from 'express';
import {
  createListing,
  getMyListings,
  getPublicListings,
  getListingById,
  updateListing,
  deleteListing,
} from '../controllers/listing.controller';
import { createReview, getListingReviews } from '../controllers/review.controller';
import { createReport } from '../controllers/report.controller';
import { listingPhotosUpload } from '../middleware/upload.middleware';
import {
  authenticate,
  authorize,
  authenticateOptional,
  requireVerifiedLandlord,
} from '../middleware/auth.middleware';

const router = Router();

// Public listings search
router.get('/', getPublicListings);

// Landlord's own listings (Must come before /:id)
router.get('/my', authenticate, authorize('LANDLORD'), getMyListings);

// Specific listing detail (public or authenticated)
router.get('/:id', authenticateOptional, getListingById);
router.get('/:id/reviews', getListingReviews);
router.post('/:id/reviews', authenticate, authorize('STUDENT'), createReview);
router.post('/:id/reports', authenticate, authorize('STUDENT'), createReport);

// Landlord listing creation (strictly requires verified landlord)
router.post(
  '/',
  authenticate,
  authorize('LANDLORD'),
  requireVerifiedLandlord,
  listingPhotosUpload,
  createListing
);

// Listing management
router.patch('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), updateListing);
router.delete('/:id', authenticate, authorize('LANDLORD', 'ADMIN'), deleteListing);

export default router;
