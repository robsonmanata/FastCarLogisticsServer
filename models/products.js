import mongoose from 'mongoose';

const ProductSchema = mongoose.Schema({
    ProductName: String,
    ProductDescription: String,
    ProductPrice: Number,
    ProductImage: String,
    ProductCategory: String,
    ProductSupplier: String,
    ProductLocation: String,
    ProductStatus: String,
    ProductQuantity: Number,
    ProductSKU: String,
    ProductQuantityUsed: Number,
    ProductBarcode: String,

}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

export default Product;
