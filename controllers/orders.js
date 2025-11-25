import mongoose from 'mongoose';
import Order from '../models/orders.js';

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
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
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateOrder = async (req, res) => {
    const { id: _id } = req.params;
    const order = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No order with that id');

    const updatedOrder = await Order.findByIdAndUpdate(_id, { ...order, _id }, { new: true });

    res.json(updatedOrder);
}

export const deleteOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No order with that id');

    await Order.findByIdAndDelete(id);

    res.json({ message: 'Order deleted successfully' });
}
