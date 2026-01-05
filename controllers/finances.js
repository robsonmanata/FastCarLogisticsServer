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
        // Get last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of month

        // Aggregate Orders by Month
        const ordersGraph = await Order.aggregate([
            { $match: { OrderDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: "$OrderDate" },
                    total: { $sum: "$Total" },
                    year: { $first: { $year: "$OrderDate" } }
                }
            }
        ]);

        // Aggregate Usage by Month
        const usageGraph = await Transaction.aggregate([
            { $match: { Type: 'Utilize', TransactionDate: { $gte: sixMonthsAgo } } },
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
                    total: { $sum: { $multiply: ["$Items.Quantity", "$productInfo.ProductPrice"] } },
                    year: { $first: { $year: "$TransactionDate" } }
                }
            }
        ]);

        // Normalize Graph Data
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = new Date().getMonth();
        const labels = [];
        const datasets = { orders: [], usage: [] };

        // Generate labels and fill data for last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(currentMonth - i);
            const monIdx = d.getMonth(); // 0-11
            const monNum = monIdx + 1; // 1-12 matching group _id
            labels.push(months[monIdx]);

            // Find matching data or 0
            const orderVal = ordersGraph.find(o => o._id === monNum)?.total || 0;
            const usageVal = usageGraph.find(u => u._id === monNum)?.total || 0;

            datasets.orders.push(orderVal);
            datasets.usage.push(usageVal);
        }

        res.status(200).json({
            totalSpent,
            totalUsedValue,
            stuckInventoryValue,
            graphData: {
                labels,
                datasets
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
