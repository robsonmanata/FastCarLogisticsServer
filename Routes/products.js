import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/products.js';
import Product from '../models/products.js';
const router = express.Router();

// Define routes here
router.get('/', getProducts);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/check', async (req, res) => {
    try {
        const { sku, name } = req.query;
        if (!sku || !name) return res.status(400).json({ error: 'SKU and Name required' });

        // 1. Check for EXACT duplicate (Same SKU AND Same Name) -> Will trigger quantity merge
        const exactMatch = await Product.findOne({ ProductSKU: sku, ProductName: name });
        if (exactMatch) {
            return res.status(200).json({ exists: true, isExactMatch: true });
        }

        // 2. Check for PARTIAL duplicate (Same Base SKU but DIFFERENT Name) -> Triggers new Revision
        // We need to find all products that start with this base SKU to determine the highest revision
        const baseSKURegex = new RegExp(`^${sku}(?:-R\\d+)?$`); // Matches SKU, SKU-R1, SKU-R2, etc.
        const partialMatches = await Product.find({ ProductSKU: baseSKURegex });

        if (partialMatches.length > 0) {
            // Find highest revision number
            let highestRevision = 0;
            partialMatches.forEach(p => {
                if (p.ProductRevision) {
                    // Extract number from 'R1', 'R2' etc.
                    const revNum = parseInt(p.ProductRevision.replace('R', ''));
                    if (!isNaN(revNum) && revNum > highestRevision) {
                        highestRevision = revNum;
                    }
                }
            });
            // Let the frontend know we need a new revision
            return res.status(200).json({
                exists: true,
                isExactMatch: false,
                highestRevision: highestRevision
            });
        }

        // No match found at all
        res.status(200).json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export default router;
