import express from 'express';
import { getCategories, createCategories, updateCategory, deleteCategory } from '../controllers/categories.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', createCategories);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
