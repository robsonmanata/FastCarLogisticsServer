import MessageMessage from '../models/message.js';
import User from '../models/user.js';
import mongoose from 'mongoose';

// Get conversations for the current user (list of users chatted with and latest message)
export const getConversations = async (req, res) => {
    try {
        const userId = req.userId;
        const objectIdUser = new mongoose.Types.ObjectId(userId);

        const convs = await MessageMessage.aggregate([
            {
                $match: {
                    $or: [
                        { sender: objectIdUser },
                        { receiver: objectIdUser }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", objectIdUser] },
                            then: "$receiver",
                            else: "$sender"
                        }
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $and: [{ $eq: ["$receiver", objectIdUser] }, { $eq: ["$isRead", false] }] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        let totalUnread = 0;
        const userIds = [];
        const conversationsMap = new Map();

        for (const conv of convs) {
            totalUnread += conv.unreadCount;
            userIds.push(conv._id);
            conversationsMap.set(conv._id.toString(), conv);
        }

        const users = await User.find({ _id: { $in: userIds } }).select('name surname email');

        const conversations = users.map(u => ({
            user: u,
            lastMessage: conversationsMap.get(u._id.toString()).lastMessage,
            unreadCount: conversationsMap.get(u._id.toString()).unreadCount
        })).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

        res.status(200).json({ conversations, totalUnread });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get chat history with a specific user
export const getMessagesWithUser = async (req, res) => {
    const { id: otherUserId } = req.params;
    const userId = req.userId;

    try {
        let messages = await MessageMessage.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        }).sort({ createdAt: -1 }).limit(100).lean();

        messages = messages.reverse();

        res.status(200).json(messages);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Send a new message
export const sendMessage = async (req, res) => {
    const { text, receiverId } = req.body;
    const senderId = req.userId;

    const newMessage = new MessageMessage({ sender: senderId, receiver: receiverId, text, createdAt: new Date() });

    try {
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

// Mark all messages from a user as read
export const markMessagesAsRead = async (req, res) => {
    const { id: senderId } = req.params;
    const receiverId = req.userId;

    try {
        await MessageMessage.updateMany(
            { sender: senderId, receiver: receiverId, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
