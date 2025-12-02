import Product from '../models/products.js';
import mongoose from 'mongoose';

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
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

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No product with that id');

    await Product.findByIdAndDelete(id);

    res.json({ message: 'Product deleted successfully' });
}


