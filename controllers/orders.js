import mongoose from 'mongoose';
import Order from '../models/orders.js';
import Product from '../models/products.js';
import { createTransaction } from './transactions.js';

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ _id: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const createOrder = async (req, res) => {
    const order = req.body;
    const newOrder = new Order(order);

    try {
        await newOrder.save();

        // Update product quantities (Add stock for deliveries) - Optimized with Promise.all and $inc
        if (newOrder.Items && newOrder.Items.length > 0) {
            await Promise.all(newOrder.Items.map(async (item) => {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { ProductQuantity: Number(item.Quantity) }
                }, { new: true });
            }));

            await createTransaction({
                User: newOrder.BilledTo,
                Type: 'Delivery Accepted',
                Items: newOrder.Items.map(item => ({
                    ProductId: item.productId,
                    ProductName: item.ProductName,
                    Quantity: Number(item.Quantity)
                })),
                Details: `Order #${newOrder.OrderNumber}`
            });
        }

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateOrder = async (req, res) => {
    const { id: _id } = req.params;
    const order = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No order with that id');

    try {
        // 1. Revert stock changes from the OLD order - Optimized
        const oldOrder = await Order.findById(_id);
        if (oldOrder && oldOrder.Items) {
            await Promise.all(oldOrder.Items.map(async (item) => {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { ProductQuantity: -Number(item.Quantity) }
                }, { new: true });
            }));

            await createTransaction({
                User: order.BilledTo || 'System',
                Type: 'Delivery Correction (Revert)',
                Items: oldOrder.Items.map(item => ({
                    ProductId: item.productId,
                    ProductName: item.ProductName,
                    Quantity: -Number(item.Quantity)
                })),
                Details: `Reverting Order #${oldOrder.OrderNumber} for update`
            });
        }

        // 2. Update the order
        const updatedOrder = await Order.findByIdAndUpdate(_id, { ...order, _id }, { new: true });

        // 3. Apply stock changes from the NEW order - Optimized
        if (updatedOrder.Items) {
            await Promise.all(updatedOrder.Items.map(async (item) => {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { ProductQuantity: Number(item.Quantity) }
                }, { new: true });
            }));

            await createTransaction({
                User: updatedOrder.BilledTo,
                Type: 'Delivery Correction (Apply)',
                Items: updatedOrder.Items.map(item => ({
                    ProductId: item.productId,
                    ProductName: item.ProductName,
                    Quantity: Number(item.Quantity)
                })),
                Details: `Updated Order #${updatedOrder.OrderNumber}`
            });
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const deleteOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No order with that id');

    try {
        // Revert stock changes (Subtract quantity as we are deleting the "delivery")
        const order = await Order.findById(id);
        if (order && order.Items) {
            await Promise.all(order.Items.map(async (item) => {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { ProductQuantity: -Number(item.Quantity) }
                }, { new: true });
            }));

            await createTransaction({
                User: order.BilledTo || 'System',
                Type: 'Delivery Cancelled',
                Items: order.Items.map(item => ({
                    ProductId: item.productId,
                    ProductName: item.ProductName,
                    Quantity: -Number(item.Quantity)
                })),
                Details: `Deleted Order #${order.OrderNumber}`
            });
        }

        await Order.findByIdAndDelete(id);

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}
