import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notifications.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', getNotifications);
router.patch('/:id/read', auth, markAsRead);

export default router;
