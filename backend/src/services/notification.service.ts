import { Notification } from "../models/notification.model";
import { emitToUser } from "./socket.service";

/**
 * Create a new notification and emit via socket
 */
const createNotification = async (
    recipientId: string,
    type: "friend_request" | "new_chat" | "company_invite" | "system_alert",
    title: string,
    message: string,
    senderId?: string,
    data?: any
) => {
    const notification = await Notification.create({
        recipientId,
        senderId,
        type,
        title,
        message,
        data,
    });

    // Populate sender info for UI display
    await notification.populate("senderId", "first_name last_name avatar");

    // Real-time emit
    emitToUser(recipientId, "new_notification", notification);

    return notification;
};

/**
 * Get unread or recent notifications for a user
 */
const getUserNotifications = async (userId: string, limit = 20) => {
    return await Notification.find({ recipientId: userId, status: "active" })
        .sort({ created_at: -1 })
        .limit(limit)
        .populate("senderId", "first_name last_name avatar");
};

/**
 * Get count of unread notifications
 */
const getUnreadCount = async (userId: string) => {
    return await Notification.countDocuments({ recipientId: userId, isRead: false });
};

/**
 * Mark a specific notification as read
 */
const markAsRead = async (notificationId: string) => {
    return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId: string) => {
    return await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
    );
};

export default {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
