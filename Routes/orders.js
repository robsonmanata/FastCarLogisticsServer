import express from 'express';
import { getOrders, createOrder, updateOrder, deleteOrder } from '../controllers/orders.js';

const router = express.Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
