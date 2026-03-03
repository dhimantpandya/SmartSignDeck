import httpStatus from "http-status";
import mongoose from "mongoose";
import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import socialService from "../services/social.service";
import successResponse from "../helpers/responses/successResponse";
import User from "../models/user.model";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const { text, recipientId, companyId, replyTo } = req.body;
    const user: any = req.user;

    const message: any = await socialService.sendMessage(
        user._id,
        text,
        recipientId,
        companyId,
        replyTo
    );

    // Dynamic import to avoid circular dependency
    const { broadcastChat, cleanId, emitToUser } = await import("../services/socket.service");
    const { default: notificationService } = await import("../services/notification.service");

    // Use robust cleanId which now handles objects/definitions
    const cSenderId = cleanId(user._id);
    const cRecipientId = cleanId(recipientId);
    const cCompanyId = cleanId(companyId);

    console.log(`[SOCIAL_CTRL] Sending msg. Text: "${text.substring(0, 10)}...", CompID: ${companyId} -> Clean: ${cCompanyId}`);

    // 1. Broadcast for real-time chat window synchronization
    broadcastChat({
        id: message._id,
        text,
        recipientId: cRecipientId,
        companyId: cCompanyId,
        senderId: cSenderId,
        senderName: `${user.first_name} ${user.last_name}`,
        avatar: user.avatar,
        replyTo: message.replyTo, // Now populated from socialService
        created_at: message.created_at
    });

    // 1.5 FALLBACK: Also emit to individual users to ensure delivery (Bypasses Room Join issues)
    // This is critical if a user is "Online" but somehow not in the company room
    if (cCompanyId) {
        // Find all members of this company
        const members = await User.find({ companyId: cCompanyId }).select('_id');
        console.log(`[SOCIAL_CTRL] 🛡️ Fallback: Broadcasting to ${members.length} members individually`);

        members.forEach(member => {
            const memberId = member._id.toString();
            // Don't emit to sender (optional, but frontend handles dupes)
            if (memberId !== cSenderId) {
                emitToUser(memberId, 'new_chat', {
                    _id: message._id,
                    id: message._id,
                    text,
                    recipientId: cRecipientId,
                    companyId: cCompanyId,
                    senderId: cSenderId,
                    senderName: `${user.first_name} ${user.last_name}`,
                    avatar: user.avatar,
                    replyTo: message.replyTo,
                    created_at: message.created_at,
                    type: 'company'
                });
            }
        });
    }

    // 2. Create notification for badges/toasts
    if (cRecipientId) {
        notificationService.createNotification(
            cRecipientId,
            "new_chat",
            `${user.first_name} ${user.last_name}`,
            text.substring(0, 50) + (text.length > 50 ? "..." : ""),
            cSenderId,
            { chatId: cSenderId }
        ).catch(err => console.error('[SOCIAL] Notification failed:', err));
    }

    successResponse(res, "Message sent", httpStatus.CREATED, message);
});

const getCompanyBoard = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user.companyId) {
        return successResponse(res, "No company associated", httpStatus.OK, []);
    }
    // 🔒 Pass user's created_at as the join-date cutoff so new users don't see
    // historical messages from before they joined the company
    const joinedAfter = (user.createdAt || user.created_at) ? new Date(user.createdAt || user.created_at) : undefined;
    const messages = await socialService.getCompanyMessages(user.companyId.toString(), user._id.toString(), joinedAfter);
    successResponse(res, "Retrieved company board", httpStatus.OK, messages);
});

const getChatHistory = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const { recipientId } = req.params;
    const messages = await socialService.getPrivateMessages(user._id.toString(), recipientId);
    successResponse(res, "Retrieved chat history", httpStatus.OK, messages);
});

const sendFriendRequest = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const { toId } = req.body;
    const request = await socialService.sendFriendRequest(user._id.toString(), toId);
    successResponse(res, "Friend request sent", httpStatus.CREATED, request);
});

const respondToFriendRequest = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const { requestId } = req.params;
    const { status } = req.body;
    const result = await socialService.respondToFriendRequest(requestId, status, user._id.toString());
    successResponse(res, "Response recorded", httpStatus.OK, result);
});

const getFriends = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const friends = await socialService.getFriends(user._id.toString());
    successResponse(res, "Retrieved friends list", httpStatus.OK, friends);
});

const getPendingRequests = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const requests = await socialService.getPendingRequests(user._id.toString());
    successResponse(res, "Retrieved pending received requests", httpStatus.OK, requests);
});

const getSentRequests = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const requests = await socialService.getSentRequests(user._id.toString());
    successResponse(res, "Retrieved sent requests", httpStatus.OK, requests);
});

const markAsSeen = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const { messageId } = req.params;

    // Validate ID
    if (!messageId || messageId === 'undefined' || !mongoose.Types.ObjectId.isValid(messageId)) {
        return successResponse(res, "Invalid message ID", httpStatus.BAD_REQUEST, {});
    }

    const { Message } = await import("../models/social.model");
    const { emitToUser } = await import("../services/socket.service");

    const msg = await Message.findById(messageId);
    if (!msg) return successResponse(res, "Message not found", httpStatus.NOT_FOUND, {});

    const userId = user._id.toString();
    const alreadySeen = msg.seenBy.some((s: any) => s.userId?.toString() === userId);
    if (!alreadySeen) {
        msg.seenBy.push({ userId: user._id, seenAt: new Date() as any });
        await msg.save();
        // Notify sender their message was seen
        emitToUser(msg.senderId.toString(), 'message_seen', { messageId, seenBy: userId, seenAt: new Date() });
    }
    successResponse(res, "Marked as seen", httpStatus.OK, { messageId });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const user: any = req.user;
    const { messageId } = req.params;
    const { scope } = req.body; // 'me' | 'everyone'

    // Validate ID
    if (!messageId || messageId === 'undefined' || !mongoose.Types.ObjectId.isValid(messageId)) {
        return successResponse(res, "Invalid message ID", httpStatus.BAD_REQUEST, {});
    }

    const { Message } = await import("../models/social.model");

    const msg = await Message.findById(messageId);
    if (!msg) return successResponse(res, "Message not found", httpStatus.NOT_FOUND, {});

    // Only the sender can delete
    if (msg.senderId.toString() !== user._id.toString()) {
        return successResponse(res, "Unauthorized", httpStatus.FORBIDDEN, {});
    }

    if (scope === 'everyone') {
        // Mark deleted for everyone
        msg.text = 'This message was deleted';
        msg.isDeleted = true;
        // Do NOT add to deletedFor if scope is everyone, so it's not hidden by service query
        await msg.save();

        // Broadcast deletion
        const { emitToUser: emitUser, emitToCompany } = await import("../services/socket.service");
        const payload = { messageId, scope: 'everyone' };

        if (msg.companyId) {
            emitToCompany(msg.companyId.toString(), 'message_deleted', payload);
        } else if (msg.recipientId) {
            emitUser(msg.recipientId.toString(), 'message_deleted', payload);
            emitUser(msg.senderId.toString(), 'message_deleted', payload);
        }
    } else {
        // Delete for me only
        if (!msg.deletedFor) msg.deletedFor = [];
        msg.deletedFor.push({ userId: user._id, scope: 'me', deletedAt: new Date() } as any);
        await msg.save();

        // Notify the user who deleted it so their UI updates
        const { emitToUser: emitUser } = await import("../services/socket.service");
        emitUser(user._id.toString(), 'message_deleted', { messageId, scope: 'me' });
    }
    successResponse(res, "Message deleted", httpStatus.OK, { messageId, scope });
});

export default {
    sendMessage,
    getCompanyBoard,
    getChatHistory,
    markAsSeen,
    deleteMessage,
    sendFriendRequest,
    respondToFriendRequest,
    getFriends,
    getPendingRequests,
    getSentRequests
};
