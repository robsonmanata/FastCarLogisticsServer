import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/products.js';
const router = express.Router();

// Define routes here
router.get('/', getProducts);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);


export default router;
