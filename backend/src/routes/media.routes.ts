import { Router } from 'express';
import { getListingPhoto, getMessageAttachment, getProfilePicture } from '../controllers/media.controller';
import { authenticate, authenticateOptional } from '../middleware/auth.middleware';

const router = Router();

router.get('/listings/:filename', authenticateOptional, getListingPhoto);
router.get('/profiles/:userId/:filename', getProfilePicture);
router.get('/messages/:filename', authenticate, getMessageAttachment);

export default router;