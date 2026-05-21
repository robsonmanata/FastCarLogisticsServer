import express from 'express';
import { globalSearch } from '../controllers/search.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, globalSearch);

export default router;
