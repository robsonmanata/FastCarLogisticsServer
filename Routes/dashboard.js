import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.js';
// Note: You might need auth middleware here depending on your auth setup
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getDashboardStats);

export default router;
