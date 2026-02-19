import httpStatus from "http-status";
import mongoose from "mongoose";
import { CollaborationRequest, Template, User } from "../models";
import ApiError from "../utils/ApiError";
import notificationService from "./notification.service";
import { type CustomPaginateOptions } from "../models/plugins/paginate.plugin";

/**
 * Send a collaboration request
 */
const sendRequest = async (senderId: string, recipientId: string, templateId: string, message?: string) => {
    // Check if template exists
    const template = await Template.findById(templateId);
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
    }

    // Check if user is trying to invite themselves
    if (senderId === recipientId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot invite yourself");
    }

    // Check if already collaborating
    if (template.collaborators?.some((id) => id.toString() === recipientId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User is already a collaborator");
    }

    // Check for existing pending request
    const existingRequest = await CollaborationRequest.findOne({
        sender: senderId,
        recipient: recipientId,
        templateId,
        status: "pending",
    });

    if (existingRequest) {
        throw new ApiError(httpStatus.BAD_REQUEST, "A pending request already exists for this user and template");
    }

    const request = await CollaborationRequest.create({
        sender: senderId,
        recipient: recipientId,
        templateId,
        message,
        status: "pending",
    });

    // Create notification for recipient
    const sender = await User.findById(senderId);
    await notificationService.createNotification(
        recipientId,
        "collaboration_request",
        "Template Collaboration Request",
        `${sender?.first_name || "Someone"} invited you to collaborate on the template "${template.name}"`,
        senderId,
        { requestId: request.id, templateId: template.id }
    );

    return request;
};

/**
 * Query collaboration requests
 */
const queryRequests = async (filter: any, options: CustomPaginateOptions) => {
    return CollaborationRequest.paginate(filter, options);
};

/**
 * Get request by id
 */
const getRequestById = async (id: string) => {
    return CollaborationRequest.findById(id);
};

/**
 * Respond to collaboration request
 */
const respondToRequest = async (requestId: string, userId: string, status: "accepted" | "declined") => {
    const request = await CollaborationRequest.findById(requestId);
    if (!request) {
        throw new ApiError(httpStatus.NOT_FOUND, "Collaboration request not found");
    }

    if (request.recipient.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only respond to your own requests");
    }

    if (request.status !== "pending") {
        throw new ApiError(httpStatus.BAD_REQUEST, `Request is already ${request.status}`);
    }

    request.status = status;
    await request.save();

    if (status === "accepted") {
        // Add user to template collaborators
        const template = await Template.findById(request.templateId);
        if (template) {
            if (!template.collaborators) template.collaborators = [];
            if (!template.collaborators.includes(request.recipient)) {
                template.collaborators.push(request.recipient);
                await template.save();
            }
        }
    }

    // Notify sender
    const recipient = await User.findById(request.sender); // The one who sent it
    const user = await User.findById(userId); // The one who accepted it
    await notificationService.createNotification(
        request.sender.toString(),
        "system_alert",
        `Collaboration Request ${status}`,
        `${user?.first_name || "A user"} has ${status} your collaboration request.`,
        userId
    );

    return request;
};

/**
 * Cancel a collaboration request
 */
const cancelRequest = async (requestId: string, userId: string) => {
    const request = await CollaborationRequest.findById(requestId);
    if (!request) {
        throw new ApiError(httpStatus.NOT_FOUND, "Collaboration request not found");
    }

    if (request.sender.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can only cancel your own requests");
    }

    if (request.status !== "pending") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Can only cancel pending requests");
    }

    request.status = "cancelled";
    await request.save();

    return request;
};

export default {
    sendRequest,
    queryRequests,
    getRequestById,
    respondToRequest,
    cancelRequest,
};
