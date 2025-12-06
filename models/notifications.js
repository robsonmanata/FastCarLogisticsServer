import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
    message: String,
    type: String, // e.g., 'Low Stock', 'Order', 'System'
    readBy: [{
        userId: String,
        userName: String,
        readAt: {
            type: Date,
            default: new Date,
        }
    }],
    createdAt: {
        type: Date,
        default: new Date,
    },
    relatedId: String, // ID of the product, order, etc.
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
