import Product from '../models/products.js';
import mongoose from 'mongoose';
import { createTransaction } from './transactions.js';
import { createNotification } from './notifications.js';
import Notification from '../models/notifications.js';

export const getProducts = async (req, res) => {
    const { page } = req.query;

    try {
        const LIMIT = 20;
        const startIndex = (Number(page) - 1) * LIMIT;
        const total = await Product.countDocuments({});

        const products = await Product.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);

        res.status(200).json({ data: products, currentPage: Number(page) || 1, numberOfPages: Math.ceil(total / LIMIT), totalCount: total });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

import Category from '../models/categories.js';

// ... (existing imports)

export const createProduct = async (req, res) => {
    const product = req.body;

    try {
        // Check for duplicates (Same Name AND Same SKU)
        const existingProduct = await Product.findOne({
            ProductSKU: product.ProductSKU,
            ProductName: product.ProductName
        });

        if (existingProduct) {
            // Update quantity instead of creating new
            const addedQuantity = Number(product.ProductQuantity) || 0;
            existingProduct.ProductQuantity = (Number(existingProduct.ProductQuantity) || 0) + addedQuantity;

            await existingProduct.save();

            // Log Transaction (Restock)
            await createTransaction({
                User: product.User || 'System',
                Type: 'Restock',
                Items: [{
                    ProductId: existingProduct._id,
                    ProductName: existingProduct.ProductName,
                    Quantity: addedQuantity
                }],
                Details: `Merged Duplicate Product: Added ${addedQuantity} to existing stock.`
            });

            // Note: Not setting low stock alert here assuming existing product was already tracked, 
            // but we could if quantity was low and is now high (unlikely for merge) or still low.
            // Let's leave it simple.

            if (addedQuantity > 0) {
                const lowStockNotification = await Notification.findOne({
                    relatedId: String(existingProduct._id),
                    type: 'Low Stock'
                }).sort({ createdAt: -1 });

                if (lowStockNotification) {
                    lowStockNotification.type = 'Restocked';
                    lowStockNotification.message = `Restocked: ${existingProduct.ProductName} now has ${existingProduct.ProductQuantity} items.`;
                    lowStockNotification.readBy = [];
                    await lowStockNotification.save();
                }
            }

            return res.status(200).json(existingProduct);
        }

        const newProduct = new Product(product);
        await newProduct.save();

        // Add product to category
        const category = await Category.findOne({ CategoryName: newProduct.ProductCategory });
        if (category) {
            category.CategoryProducts.push({
                productId: newProduct._id,
                ProductName: newProduct.ProductName,
                ProductSKU: newProduct.ProductSKU

            });
            await category.save();
        }

        await createTransaction({
            User: product.User || 'System',
            Type: 'Product Created',
            Items: [{
                ProductId: newProduct._id,
                ProductName: newProduct.ProductName,
                Quantity: Number(newProduct.ProductQuantity) || 0
            }],
            Details: `Created Product: ${newProduct.ProductName}`
        });

        if ((Number(newProduct.ProductQuantity) || 0) < 10) {
            await createNotification({
                message: `Low Stock Alert: ${newProduct.ProductName} has ${newProduct.ProductQuantity} items left.`,
                type: 'Low Stock',
                relatedId: newProduct._id
            });
        }

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    const { id: _id } = req.params;
    const product = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No product with that id');

    try {
        const oldProduct = await Product.findById(_id);

        if (product.ProductCategory && oldProduct.ProductCategory !== product.ProductCategory) {
            // Remove from old category
            const oldCategory = await Category.findOne({ CategoryName: oldProduct.ProductCategory });
            if (oldCategory) {
                oldCategory.CategoryProducts = oldCategory.CategoryProducts.filter((p) => p.productId !== String(_id));
                await oldCategory.save();
            }

            // Add to new category
            const newCategory = await Category.findOne({ CategoryName: product.ProductCategory });
            if (newCategory) {
                newCategory.CategoryProducts.push({
                    productId: _id,
                    ProductName: product.ProductName || oldProduct.ProductName,
                    ProductSKU: product.ProductSKU || oldProduct.ProductSKU
                });
                await newCategory.save();
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(_id, { ...product, _id }, { new: true });

        // Calculate quantity difference to log transaction
        const quantityDiff = (Number(updatedProduct.ProductQuantity) || 0) - (Number(oldProduct.ProductQuantity) || 0);

        if (quantityDiff !== 0) {
            await createTransaction({
                User: product.User || 'System',
                Type: quantityDiff > 0 ? 'Restock' : 'Utilize',
                Items: [{
                    ProductId: _id,
                    ProductName: updatedProduct.ProductName,
                    Quantity: quantityDiff
                }],
                Details: quantityDiff > 0 ? 'Manual Restock' : 'Stock Utilization'
            });

            if (quantityDiff > 0) {
                console.log(`[RestockDebug] Quantity increased by ${quantityDiff}. Product ID: ${_id}`);
                const lowStockNotification = await Notification.findOne({
                    relatedId: String(_id),
                    type: 'Low Stock'
                }).sort({ createdAt: -1 });

                if (lowStockNotification) {
                    console.log('[RestockDebug] Found Low Stock notification');
                    lowStockNotification.type = 'Restocked';
                    lowStockNotification.message = `Restocked: ${updatedProduct.ProductName} now has ${updatedProduct.ProductQuantity} items.`;
                    lowStockNotification.readBy = [];
                    await lowStockNotification.save();
                } else {
                    console.log('[RestockDebug] No Low Stock notification found');
                }
            }
        }

        if ((Number(updatedProduct.ProductQuantity) || 0) < 10) {
            await createNotification({
                message: `Low Stock Alert: ${updatedProduct.ProductName} has ${updatedProduct.ProductQuantity} items left.`,
                type: 'Low Stock',
                relatedId: updatedProduct._id
            });
        }


        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No product with that id');

    const product = await Product.findById(id);
    await Product.findByIdAndDelete(id);

    if (product) {
        await createTransaction({
            User: 'System', // Ideally pass user from frontend/auth if possible
            Type: 'Product Deleted',
            Items: [{
                ProductId: product._id,
                ProductName: product.ProductName,
                Quantity: -Number(product.ProductQuantity) || 0
            }],
            Details: `Deleted Product: ${product.ProductName}`
        });
    }

    res.json({ message: 'Product deleted successfully' });
}


