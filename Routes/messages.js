import express from 'express';
import { getConversations, getMessagesWithUser, sendMessage, markMessagesAsRead } from '../controllers/messages.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/conversations', auth, getConversations);
router.get('/:id', auth, getMessagesWithUser);
router.post('/', auth, sendMessage);
router.put('/:id/read', auth, markMessagesAsRead);

export default router;
