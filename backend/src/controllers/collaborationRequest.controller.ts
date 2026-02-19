import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import pick from "../utils/pick";
import mongoose from "mongoose";
import { collaborationRequestService } from "../services";

const sendRequest = catchAsync(async (req, res) => {
    const { recipientId, templateId, message } = req.body;
    const senderId = (req as any).user.id;
    const request = await collaborationRequestService.sendRequest(senderId, recipientId, templateId, message);
    res.status(httpStatus.CREATED).send(request);
});

const getRequests = catchAsync(async (req, res) => {
    const { type, status, templateId } = pick(req.query, ["type", "status", "templateId"]);
    const filter: any = {};
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not found in request");
    }

    if (status) filter.status = status;
    if (templateId && mongoose.Types.ObjectId.isValid(templateId)) {
        filter.templateId = new mongoose.Types.ObjectId(templateId);
    }

    const userObjId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    if (type === "incoming") {
        filter.recipient = userObjId;
    } else if (type === "outgoing") {
        filter.sender = userObjId;
    } else {
        // Both
        filter.$or = [{ recipient: userObjId }, { sender: userObjId }];
    }

    const options = pick(req.query, ["sortBy", "limit", "page"]);
    options.populate = "sender,recipient,templateId";
    const result = await collaborationRequestService.queryRequests(filter, options);
    res.send(result);
});

const respondToRequest = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id;
    const request = await collaborationRequestService.respondToRequest(requestId, userId, status);
    res.send(request);
});

const cancelRequest = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const userId = (req as any).user.id;
    const request = await collaborationRequestService.cancelRequest(requestId, userId);
    res.send(request);
});

export default {
    sendRequest,
    getRequests,
    respondToRequest,
    cancelRequest,
};
