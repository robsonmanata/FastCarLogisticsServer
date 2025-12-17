import Transaction from '../models/transactions.js';

export const getTransactions = async (req, res) => {
    const { page } = req.query;

    try {
        const LIMIT = 20;
        const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page
        const total = await Transaction.countDocuments({});

        const transactions = await Transaction.find()
            .sort({ TransactionDate: -1 })
            .limit(LIMIT)
            .skip(startIndex)
            .populate('Items.ProductId');

        res.status(200).json({ data: transactions, currentPage: Number(page) || 1, numberOfPages: Math.ceil(total / LIMIT), totalCount: total });
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
