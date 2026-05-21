import Order from '../models/orders.js';
import Product from '../models/products.js';
import Transaction from '../models/transactions.js';

export const getFinanceStats = async (req, res) => {
    try {
        // 1. Total Amount Spent on Orders (Sum of Order.Total)
        const totalSpentData = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$Total" } } }
        ]);
        const totalSpent = totalSpentData.length > 0 ? totalSpentData[0].total : 0;

        // 2. Total Value of Items Used (Transaction Type: 'Utilize')
        // Since Transactions don't store price, we must look up current Product Price.
        // This is an approximation if prices change over time.
        const totalUsedData = await Transaction.aggregate([
            { $match: { Type: 'Utilize' } },
            { $unwind: "$Items" },
            {
                $lookup: {
                    from: "products",
                    localField: "Items.ProductId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ["$Items.Quantity", "$productInfo.ProductPrice"] } }
                }
            }
        ]);
        const totalUsedValue = totalUsedData.length > 0 ? totalUsedData[0].totalValue : 0;

        // 3. Stuck Inventory Value (> 1 year old and has quantity)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const stuckInventoryData = await Product.aggregate([
            {
                $match: {
                    updatedAt: { $lt: oneYearAgo },
                    ProductQuantity: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ["$ProductQuantity", "$ProductPrice"] } }
                }
            }
        ]);
        const stuckInventoryValue = stuckInventoryData.length > 0 ? stuckInventoryData[0].totalValue : 0;

        // 4. Graph Data: Money Spent (Orders) vs Money Used (Usage) per Month

        // 1. Get all available years logic
        const orderYears = await Order.aggregate([
            { $project: { year: { $year: "$OrderDate" } } },
            { $group: { _id: "$year" } },
            { $sort: { _id: -1 } }
        ]);
        const transactionYears = await Transaction.aggregate([
            { $match: { Type: 'Utilize' } },
            { $project: { year: { $year: "$TransactionDate" } } },
            { $group: { _id: "$year" } },
            { $sort: { _id: -1 } }
        ]);

        const availableYears = [...new Set([
            ...orderYears.map(y => y._id),
            ...transactionYears.map(y => y._id)
        ])].sort((a, b) => b - a);

        // Determine target year
        let targetYear = req.query.year ? parseInt(req.query.year) : (availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());

        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

        // Aggregate Orders by Month
        const ordersGraph = await Order.aggregate([
            { $match: { OrderDate: { $gte: startOfYear, $lte: endOfYear } } },
            {
                $group: {
                    _id: { $month: "$OrderDate" },
                    total: { $sum: "$Total" }
                }
            }
        ]);

        // Aggregate Usage by Month
        const usageGraph = await Transaction.aggregate([
            { $match: { Type: 'Utilize', TransactionDate: { $gte: startOfYear, $lte: endOfYear } } },
            { $unwind: "$Items" },
            {
                $lookup: {
                    from: "products",
                    localField: "Items.ProductId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: { $month: "$TransactionDate" },
                    total: { $sum: { $multiply: ["$Items.Quantity", "$productInfo.ProductPrice"] } }
                }
            }
        ]);

        // Normalize Graph Data
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const labels = months;
        const datasets = { orders: [], usage: [] };

        // Generate data for all 12 months
        for (let i = 1; i <= 12; i++) {
            // Find matching data or 0
            const orderVal = ordersGraph.find(o => o._id === i)?.total || 0;
            const usageVal = usageGraph.find(u => u._id === i)?.total || 0;

            datasets.orders.push(orderVal);
            datasets.usage.push(usageVal);
        }

        res.status(200).json({
            totalSpent,
            totalUsedValue,
            stuckInventoryValue,
            graphData: {
                labels,
                datasets,
                year: targetYear,
                availableYears
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
