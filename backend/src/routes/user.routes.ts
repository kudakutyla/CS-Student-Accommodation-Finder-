import { Router } from 'express';
import { addFavourite, getMyFavourites, removeFavourite } from '../controllers/favourite.controller';
import { getCurrentUserProfile, updateCurrentUserProfile, uploadCurrentUserProfilePicture } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { profilePictureUpload } from '../middleware/upload.middleware';

const router = Router();

router.get('/me', authenticate, getCurrentUserProfile);
router.patch('/me', authenticate, updateCurrentUserProfile);
router.post('/me/profile-picture', authenticate, profilePictureUpload, uploadCurrentUserProfilePicture);
router.get('/favourites', authenticate, authorize('STUDENT'), getMyFavourites);
router.post('/favourites/:id', authenticate, authorize('STUDENT'), addFavourite);
router.delete('/favourites/:id', authenticate, authorize('STUDENT'), removeFavourite);

export default router;
