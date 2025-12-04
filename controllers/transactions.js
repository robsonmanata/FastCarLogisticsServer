import Transaction from '../models/transactions.js';

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ TransactionDate: -1 }).populate('Items.ProductId');
        res.status(200).json(transactions);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createTransaction = async (data) => {
    const newTransaction = new Transaction(data);
    try {
        await newTransaction.save();
    } catch (error) {
        console.log('Error creating transaction:', error);
    }
};
