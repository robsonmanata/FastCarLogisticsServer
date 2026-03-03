import MessageMessage from '../models/message.js';
import User from '../models/user.js';
import mongoose from 'mongoose';

// Get conversations for the current user (list of users chatted with and latest message)
export const getConversations = async (req, res) => {
    try {
        const userId = req.userId;

        // Find all unique users the current user has exchanged messages with
        const messages = await MessageMessage.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ createdAt: -1 });

        const conversationsMap = new Map();
        let totalUnread = 0;

        for (const msg of messages) {
            // Determine the "other" person in the chat
            const otherUserId = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();

            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, {
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            // If the message was sent to the current user and is unread, increment count
            if (msg.receiver.toString() === userId && !msg.isRead) {
                const conv = conversationsMap.get(otherUserId);
                conv.unreadCount += 1;
                conversationsMap.set(otherUserId, conv);
                totalUnread += 1;
            }
        }

        // Fetch user details for the other users
        const userIds = Array.from(conversationsMap.keys());
        const users = await User.find({ _id: { $in: userIds } }).select('name surname email profilePicture');

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
        const messages = await MessageMessage.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        }).sort({ createdAt: 1 }); // Oldest first for chat UI

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
