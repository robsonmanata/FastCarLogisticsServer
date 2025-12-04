import Category from '../models/categories.js';
import mongoose from 'mongoose';
import Product from '../models/products.js';
import { createTransaction } from './transactions.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ _id: -1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createCategories = async (req, res) => {
    const category = req.body;
    const newCategory = new Category(category);

    try {
        await newCategory.save();

        await createTransaction({
            User: category.User || 'System',
            Type: 'Category Created',
            Items: [{
                ProductName: newCategory.CategoryName,
                Quantity: 0
            }],
            Details: `Created Category: ${newCategory.CategoryName}`
        });

        res.status(201).json(newCategory);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateCategory = async (req, res) => {
    const { id: _id } = req.params;
    const category = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No category with that id');

    try {
        const oldCategory = await Category.findById(_id);

        if (category.CategoryName && oldCategory.CategoryName !== category.CategoryName) {
            await Product.updateMany(
                { ProductCategory: oldCategory.CategoryName },
                { ProductCategory: category.CategoryName }
            );
        }

        const updatedCategory = await Category.findByIdAndUpdate(_id, { ...category, _id }, { new: true });

        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteCategory = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No category with that id');

    const category = await Category.findById(id);
    await Category.findByIdAndDelete(id);

    if (category) {
        await createTransaction({
            User: 'System',
            Type: 'Category Deleted',
            Items: [{
                ProductName: category.CategoryName,
                Quantity: 0
            }],
            Details: `Deleted Category: ${category.CategoryName}`
        });
    }

    res.json({ message: 'Category deleted successfully' });
}


