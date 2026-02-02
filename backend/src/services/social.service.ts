import httpStatus from "http-status";
import { Message, FriendRequest } from "../models/social.model";
import ApiError from "../utils/ApiError";
import { emitToUser } from "./socket.service";

/**
 * Send a message
 */
const sendMessage = async (senderId: string, text: string, recipientId?: string, companyId?: string) => {
    const message = await Message.create({
        senderId,
        text,
        recipientId,
        companyId,
    });
    return message;
};

/**
 * Get messages for a company
 */
const getCompanyMessages = async (companyId: string) => {
    return await Message.find({ companyId })
        .sort({ created_at: -1 })
        .limit(50)
        .populate("senderId", "first_name last_name avatar");
};

/**
 * Get private chat history
 */
const getPrivateMessages = async (user1: string, user2: string) => {
    return await Message.find({
        $or: [
            { senderId: user1, recipientId: user2 },
            { senderId: user2, recipientId: user1 },
        ],
    })
        .sort({ created_at: -1 })
        .limit(50)
        .populate("senderId", "first_name last_name avatar");
};

/**
 * FRIEND REQUESTS
 */

const sendFriendRequest = async (fromId: string, toId: string) => {
    // Check if exists
    const existing = await FriendRequest.findOne({
        $or: [
            { fromId, toId },
            { fromId: toId, toId: fromId }
        ]
    });

    if (existing) {
        if (existing.status === "rejected") {
            // If it was rejected, we allow sending it again by deleting the old one
            await FriendRequest.deleteOne({ _id: existing._id });
        } else {
            throw new ApiError(httpStatus.BAD_REQUEST, "Friend request already exists or you are already connected");
        }
    }

    const request = await FriendRequest.create({ fromId, toId });

    // Notify recipient
    emitToUser(toId, "friend_request_received", { fromId });

    return request;
};

const respondToFriendRequest = async (requestId: string, status: "accepted" | "rejected", userId: string) => {
    const request = await FriendRequest.findById(requestId);
    if (!request || request.toId.toString() !== userId) {
        throw new ApiError(httpStatus.NOT_FOUND, "Friend request not found");
    }

    if (status === "rejected") {
        await FriendRequest.deleteOne({ _id: requestId });
        return { message: "Request rejected and removed" };
    }

    request.status = status;
    await request.save();

    if (status === "accepted") {
        // Send system message to both users
        await sendMessage(request.fromId.toString(), "You are now connected with this user!", userId);
        await sendMessage(userId, "You are now connected with this user!", request.fromId.toString());

        // Notify original sender
        emitToUser(request.fromId.toString(), "friend_request_accepted", {
            requestId: request._id,
            toId: userId,
            user: await import("../models/user.model").then(m => m.default.findById(userId, "first_name last_name avatar"))
        });

        // Notify acceptor (current user) to update their UI
        emitToUser(userId, "friend_request_accepted", {
            requestId: request._id,
            fromId: request.fromId,
            user: await import("../models/user.model").then(m => m.default.findById(request.fromId, "first_name last_name avatar"))
        });
    }

    return request;
};

const getFriends = async (userId: string) => {
    const connections = await FriendRequest.find({
        status: "accepted",
        $or: [{ fromId: userId }, { toId: userId }]
    }).populate("fromId toId", "first_name last_name avatar email");

    return connections.map(c => {
        const fromDoc = c.fromId as any;
        const toDoc = c.toId as any;
        const fromIdStr = (fromDoc.id || fromDoc._id || fromDoc).toString();
        const other = fromIdStr === userId ? toDoc : fromDoc;
        return other;
    });
};

const getPendingRequests = async (userId: string) => {
    return await FriendRequest.find({
        toId: userId,
        status: "pending"
    }).populate("fromId", "first_name last_name avatar email");
};

const getSentRequests = async (userId: string) => {
    return await FriendRequest.find({
        fromId: userId,
        status: "pending"
    }).populate("toId", "first_name last_name avatar email");
};

export default {
    sendMessage,
    getCompanyMessages,
    getPrivateMessages,
    sendFriendRequest,
    respondToFriendRequest,
    getFriends,
    getPendingRequests,
    getSentRequests
};
