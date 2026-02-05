import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { AdminRequest, User } from "../models";
import { userService } from "../services";
import catchAsync from "../utils/catchAsync";
import successResponse from "../helpers/responses/successResponse";
import ApiError from "../utils/ApiError";

const createRequest = catchAsync(async (req: Request, res: Response) => {
    const { targetUserId, type, details } = req.body;
    const requesterId = (req.user as any).id;
    const companyId = (req.user as any).companyId;

    if (!companyId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Requester must belong to a company");
    }

    const request = await AdminRequest.create({
        requesterId,
        targetUserId,
        companyId,
        type,
        details,
    });

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
    }

    successResponse(res, `Request ${status.toLowerCase()} successfully`, httpStatus.OK, request);
});

export { createRequest, getRequests, processRequest };
