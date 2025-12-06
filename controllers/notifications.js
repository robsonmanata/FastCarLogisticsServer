import Notification from '../models/notifications.js';
import mongoose from 'mongoose';

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    const { id } = req.params;
    const { userName } = req.body;

    if (!req.userId) return res.json({ message: 'Unauthenticated' });

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No notification with that id');

    const notification = await Notification.findById(id);

    const alreadyRead = notification.readBy.find((r) => r.userId === String(req.userId));

    if (!alreadyRead) {
        notification.readBy.push({ userId: req.userId, userName, readAt: new Date() });
    }

    const updatedNotification = await Notification.findByIdAndUpdate(id, notification, { new: true });

    res.json(updatedNotification);
};

export const createNotification = async (data) => {
    try {
        const newNotification = new Notification(data);
        await newNotification.save();
        return newNotification;
    } catch (error) {
        console.log(error);
    }
};
