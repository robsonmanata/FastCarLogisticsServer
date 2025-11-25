import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    products: [{
        productsku: String,
        quantity: Number,
        name: String,
        price: Number
    }],
    OrderTotal: Number,
    OrderStatus: {
        type: String,
        default: 'Pending'
    },
    OrderDate: {
        type: Date,
        default: new Date()
    }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
