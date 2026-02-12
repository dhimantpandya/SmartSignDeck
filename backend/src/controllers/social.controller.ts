import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import socialService from "../services/social.service";
import successResponse from "../helpers/responses/successResponse";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const { text, recipientId, companyId } = req.body;
    const user: any = req.user;

    const message: any = await socialService.sendMessage(
        user._id,
        text,
        recipientId,
        companyId
    );

    // Dynamic import to avoid circular dependency
    const { broadcastChat, cleanId } = await import("../services/socket.service");
    const { default: notificationService } = await import("../services/notification.service");

    const cSenderId = cleanId(user._id);
    const cRecipientId = cleanId(recipientId);
    const cCompanyId = cleanId(companyId);

    // 1. Broadcast for real-time chat window synchronization
    broadcastChat({
        text,
        recipientId: cRecipientId,
        companyId: cCompanyId,
        senderId: cSenderId,
        senderName: `${user.first_name} ${user.last_name}`,
        avatar: user.avatar,
        created_at: message.created_at
    });

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
    const messages = await socialService.getCompanyMessages(user.companyId.toString());
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

export default {
    sendMessage,
    getCompanyBoard,
    getChatHistory,
    sendFriendRequest,
    respondToFriendRequest,
    getFriends,
    getPendingRequests,
    getSentRequests
};
