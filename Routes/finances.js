import express from 'express';
import { getFinanceStats } from '../controllers/finances.js';

const router = express.Router();

// Define routes
router.get('/stats', getFinanceStats);

export default router;
