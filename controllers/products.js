import Product from '../models/products.js';
import mongoose from 'mongoose';
import { createTransaction } from './transactions.js';

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ _id: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

import Category from '../models/categories.js';

// ... (existing imports)

export const createProduct = async (req, res) => {
    const product = req.body;
    const newProduct = new Product(product);

    try {
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


