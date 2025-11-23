import mongoose from 'mongoose';

const categorySchema = mongoose.Schema({
    CategoryName: String,
    CategoryDescription: String,
    CategoryImage: String,
    CategoryProducts: [{
        ProductName: String,
        ProductSKU: String,

    }],


});

const Category = mongoose.model('Category', categorySchema);

export default Category;