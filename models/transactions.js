import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
    TransactionDate: {
        type: Date,
        default: Date.now
    },
    User: String,
    Type: String, // 'Restock', 'Utilize', 'Order'
    Items: [{
        ProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        ProductName: String,
        Quantity: Number
    }],
    Details: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
