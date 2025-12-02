import Category from '../models/categories.js';
import mongoose from 'mongoose';
import Product from '../models/products.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
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

    await Category.findByIdAndDelete(id);

    res.json({ message: 'Category deleted successfully' });
}


