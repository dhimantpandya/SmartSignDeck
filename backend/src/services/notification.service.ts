import { Notification } from "../models/notification.model";
import { emitToUser, cleanId } from "./socket.service";

/**
 * Create a new notification and emit via socket
 */
const createNotification = async (
    recipientId: string,
    type: "friend_request" | "new_chat" | "company_invite" | "system_alert" | "collaboration_request",
    title: string,
    message: string,
    senderId?: string,
    data?: any
) => {
    const cRecipientId = cleanId(recipientId);
    const cSenderId = cleanId(senderId);

    const notification = await Notification.create({
        recipientId: cRecipientId,
        senderId: cSenderId,
        type,
        title,
        message,
        data,
    });

    // Populate sender info for UI display
    await notification.populate("senderId", "first_name last_name avatar");

    // Real-time emit
    emitToUser(cRecipientId, "new_notification", notification);

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

/**
 * Mark all notifications of a certain type/sender as read for a user
 */
const markChatAsRead = async (userId: string, type: string, senderId?: string) => {
    const cUserId = cleanId(userId);
    const cSenderId = senderId ? cleanId(senderId) : undefined;

    const query: any = { recipientId: cUserId, type, isRead: false };
    if (cSenderId) {
        query.senderId = cSenderId;
    }
    console.log('[NOTIFICATION] Marking chat as read:', { userId: cUserId, type, senderId: cSenderId, query });
    const result = await Notification.updateMany(query, { isRead: true });
    console.log('[NOTIFICATION] Mark chat as read result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
    return result;
};

/**
 * Mark all notifications of specific types as read for a user
 */
const markNotificationsByTypeAsRead = async (userId: string, types: string[]) => {
    const cUserId = cleanId(userId);
    return await Notification.updateMany(
        { recipientId: cUserId, type: { $in: types }, isRead: false },
        { isRead: true }
    );
};

export default {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    markChatAsRead,
    markNotificationsByTypeAsRead,
};
