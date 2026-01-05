import Product from '../models/products.js';
import Order from '../models/orders.js';
import Category from '../models/categories.js';
import Notification from '../models/notifications.js';

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.userId; // Assuming auth middleware populates this

        // 1. Low Stock Items (Quantity < 10)
        const lowStockCount = await Product.countDocuments({ ProductQuantity: { $lt: 10 } });

        // 2. Total Items (Products)
        const productsCount = await Product.countDocuments({});

        // 3. Total Orders
        const ordersCount = await Order.countDocuments({});

        // 4. Notifications (Unread for specific user)
        // Assuming 'readBy' array contains userIds who have read it.
        // We want notifications where userId is NOT in readBy.userId
        const unreadNotificationsCount = await Notification.countDocuments({
            "readBy.userId": { $ne: userId }
        });

        // 5. Items Used (Sum of ProductQuantityUsed)
        const itemsUsedData = await Product.aggregate([
            { $group: { _id: null, totalUsed: { $sum: "$ProductQuantityUsed" } } }
        ]);
        const itemsUsedCount = itemsUsedData.length > 0 ? itemsUsedData[0].totalUsed : 0;

        // 6. Categories Count
        const categoriesCount = await Category.countDocuments({});

        // 7. Items Ordered (Sum of quantity in all orders)
        // Order.Items is an array. We need to unwind and sum.
        const itemsOrderedData = await Order.aggregate([
            { $unwind: "$Items" },
            { $group: { _id: null, totalOrdered: { $sum: "$Items.Quantity" } } }
        ]);
        const itemsOrderedCount = itemsOrderedData.length > 0 ? itemsOrderedData[0].totalOrdered : 0;

        // 8. Top Categories (Based on usage)
        const topCategoriesData = await Product.aggregate([
            { $match: { ProductQuantityUsed: { $gt: 0 } } },
            {
                $group: {
                    _id: "$ProductCategory",
                    totalUsed: { $sum: "$ProductQuantityUsed" },
                    // Get the image of the most used product in this category
                    image: { $first: "$ProductImage" }
                }
            },
            { $sort: { totalUsed: -1 } },
            { $limit: 4 }
        ]);

        res.status(200).json({
            lowStock: lowStockCount,
            products: productsCount,
            orders: ordersCount,
            notifications: unreadNotificationsCount,
            itemsUsed: itemsUsedCount,
            categories: categoriesCount,
            itemsOrdered: itemsOrderedCount,
            topCategories: topCategoriesData
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
