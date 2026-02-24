import { type Request, type Response } from "express";
import httpStatus from "http-status";
import AdminRequest from "../models/adminRequest.model";
import User from "../models/user.model";
import { userService } from "../services";
import catchAsync from "../utils/catchAsync";
import successResponse from "../helpers/responses/successResponse";
import ApiError from "../utils/ApiError";
import notificationService from "../services/notification.service";

const createRequest = catchAsync(async (req: Request, res: Response) => {
    const { targetUserId, type, details } = req.body;
    const requesterId = (req.user as any).id;
    const companyId = (req.user as any).companyId;

    if (!companyId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Requester must belong to a company");
    }

    // 🔒 Restriction: Admin cannot request role change for another Admin of the same company
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, "Target user not found");
    }

    const requesterRole = (req.user as any).role;
    if (requesterRole === 'admin' && targetUser.role === 'admin' && targetUser.companyId?.toString() === companyId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Admins cannot send role change requests for other admins of the same company.");
    }

    // 🕒 Rate Limit Check: 24 hours for the same target user from same requester
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRecentRequest = await AdminRequest.findOne({
        requesterId,
        targetUserId,
        type,
        createdAt: { $gte: twentyFourHoursAgo }
    });

    if (existingRecentRequest) {
        throw new ApiError(httpStatus.TOO_MANY_REQUESTS, `A ${type.replace('_', ' ').toLowerCase()} request for this user was already submitted in the last 24 hours.`);
    }

    const request = await AdminRequest.create({
        requesterId,
        targetUserId,
        companyId,
        type,
        details,
        targetUserInfo: {
            name: `${targetUser.first_name} ${targetUser.last_name || ''}`.trim(),
            email: targetUser.email,
            role: targetUser.role
        }
    });

    // 🔔 Notify all Super Admins about the new request
    try {
        const superAdmins = await User.find({ role: 'super_admin' });
        const requester = await User.findById(requesterId);

        for (const admin of superAdmins) {
            await notificationService.createNotification(
                admin._id.toString(),
                "system_alert",
                "New Admin Request",
                `${requester?.first_name || 'An admin'} has submitted a new ${type.replace('_', ' ')} request.`,
                requesterId,
                { requestId: request._id, type }
            );
        }
        console.log(`[AdminRequest] Notified ${superAdmins.length} super admins about request ${request._id}`);
    } catch (notifErr) {
        console.error("[AdminRequest] Super Admin notification failed:", notifErr);
    }

    successResponse(res, "Request submitted to Super Admin", httpStatus.CREATED, request);
});

const getRequests = catchAsync(async (req: Request, res: Response) => {
    // Only Super Admin can view all requests
    const filter = (req.user as any).role === 'super_admin' ? {} : { requesterId: (req.user as any).id };
    const requests = await AdminRequest.find(filter)
        .populate('requesterId', 'first_name last_name email')
        .populate('targetUserId', 'first_name last_name email')
        .sort({ createdAt: -1 });

    successResponse(res, "Requests retrieved", httpStatus.OK, requests);
});

const processRequest = catchAsync(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { status, adminComment } = req.body; // APPROVED or REJECTED

    if ((req.user as any).role !== 'super_admin') {
        throw new ApiError(httpStatus.FORBIDDEN, "Only Super Admin can process requests");
    }

    const request = await AdminRequest.findById(requestId);
    if (!request) {
        throw new ApiError(httpStatus.NOT_FOUND, "Request not found");
    }

    if (request.status !== 'PENDING') {
        throw new ApiError(httpStatus.BAD_REQUEST, "Request already processed");
    }

    request.status = status;
    request.adminComment = adminComment;
    await request.save();

    if (status === 'APPROVED') {
        const targetUser = await User.findById(request.targetUserId);
        if (!targetUser) {
            throw new ApiError(httpStatus.NOT_FOUND, "Target user no longer exists");
        }

        if (request.type === 'DELETE') {
            await userService.deleteUserById(request.targetUserId.toString());
        } else if (request.type === 'ROLE_UPDATE') {
            targetUser.role = (request as any).details.proposedRole;
            await targetUser.save();
        }

        // 🔄 Auto-approve older pending requests of the same type for this user
        try {
            const olderRequests = await AdminRequest.updateMany(
                {
                    _id: { $ne: request._id },
                    targetUserId: request.targetUserId,
                    type: request.type,
                    status: 'PENDING',
                    createdAt: { $lt: request.createdAt }
                },
                {
                    status: 'APPROVED',
                    adminComment: adminComment || "Automatically approved as a newer request was processed."
                }
            );
            if (olderRequests.modifiedCount > 0) {
                console.log(`[AdminRequest] Auto-approved ${olderRequests.modifiedCount} older pending requests for user ${request.targetUserId}`);
            }
        } catch (autoErr) {
            console.error("[AdminRequest] Auto-approval of older requests failed:", autoErr);
        }
    }

    // 🔔 Notify the requester about the status update
    try {
        const title = status === 'APPROVED' ? "Request Approved" : "Request Rejected";
        const message = `Your request to ${request.type === 'DELETE' ? 'delete a user' : 'update a user role'} was ${status.toLowerCase()} by the Super Admin.`;

        await notificationService.createNotification(
            request.requesterId.toString(),
            "system_alert",
            title,
            message,
            (req.user as any).id,
            { requestId: request._id, status }
        );
        console.log(`[AdminRequest] Notification sent to ${request.requesterId} for request ${request._id}`);
    } catch (notifErr) {
        console.error("[AdminRequest] Notification failed:", notifErr);
    }

    successResponse(res, `Request ${status.toLowerCase()} successfully`, httpStatus.OK, request);
});

export { createRequest, getRequests, processRequest };
