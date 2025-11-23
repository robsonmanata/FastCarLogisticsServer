import express from 'express';
import { getWarehouses, createWarehouse } from '../controllers/warehouses.js';

const router = express.Router();

router.get('/', getWarehouses);
router.post('/', createWarehouse);

export default router;
