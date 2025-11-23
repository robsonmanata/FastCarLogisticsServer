import express from 'express';
import { getProducts, createProduct } from '../controllers/products.js';
const router = express.Router();

// Define routes here
router.get('/', getProducts);
router.post('/', createProduct);


export default router;
