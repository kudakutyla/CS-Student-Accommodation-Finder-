import { Router } from 'express';
import {
  getMyConversations,
  createConversation,
  getConversationMessages,
  createMessage,
  markConversationAsRead,
} from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { messageAttachmentUpload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', authenticate, getMyConversations);
router.post('/', authenticate, createConversation);
router.get('/:id/messages', authenticate, getConversationMessages);
router.post('/:id/messages', authenticate, messageAttachmentUpload, createMessage);
router.patch('/:id/read', authenticate, markConversationAsRead);

export default router;
