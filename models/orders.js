import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    OrderNumber: String,
    OrderDate: {
        type: Date,
        default: new Date()
    },
    BilledTo: String,
    Total: Number,
    Status: {
        type: String,
        default: 'Pending'
    },
    Items: [{
        productId: String,
        ProductName: String,
        Quantity: Number,
        Price: Number
    }]
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
