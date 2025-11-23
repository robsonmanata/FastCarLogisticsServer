import express from 'express';
import { getCategories, createCategories } from '../controllers/categories.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', createCategories);

export default router;
