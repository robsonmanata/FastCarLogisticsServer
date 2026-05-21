import mongoose from 'mongoose';
import Product from '../models/products.js';
import Order from '../models/orders.js';
import User from '../models/user.js';

export const globalSearch = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(200).json([]);
    }

    try {
        const regex = new RegExp(q, 'i');
        const numberQuery = !isNaN(Number(q)) ? Number(q) : null;

        // Search Products
        const productQuery = {
            $or: [
                { ProductName: regex },
                { ProductSKU: regex },
                { ProductCategory: regex },
                { ProductBarcode: regex }
            ]
        };
        const products = await Product.find(productQuery).limit(5);

        // Search Orders
        const orderQuery = {
            $or: [
                { BilledTo: regex },
                { Status: regex }
            ]
        };
        if (numberQuery) {
            orderQuery.$or.push({ OrderNumber: numberQuery });
        }
        const orders = await Order.find(orderQuery).limit(5);

        const currentUser = await User.findById(req.userId);
        const isAdmin = currentUser && currentUser.role === 'Admin';

        // Search Users (Admin only)
        let users = [];
        if (isAdmin) {
            const userQuery = {
                $or: [
                    { name: regex },
                    { surname: regex },
                    { email: regex },
                    { role: regex }
                ]
            };
            users = await User.find(userQuery).limit(5);
        }

        // Format Results
        let formattedResults = [];

        products.forEach(p => {
            formattedResults.push({
                _id: p._id,
                label: `Product: ${p.ProductName} (${p.ProductSKU})`,
                type: 'product',
                data: p
            });
        });

        orders.forEach(o => {
            formattedResults.push({
                _id: o._id,
                label: `Order #${o.OrderNumber} - ${o.BilledTo}`,
                type: 'order',
                data: o
            });
        });

        users.forEach(u => {
            formattedResults.push({
                _id: u._id,
                label: `User: ${u.name} ${u.surname} (${u.role})`,
                type: 'user',
                data: u
            });
        });

        res.status(200).json(formattedResults);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
