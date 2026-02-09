import httpStatus from "http-status";
import { type Request, type Response } from "express";
import catchAsync from "../utils/catchAsync";
import successResponse from "../helpers/responses/successResponse";
import playbackLogService from "../services/playbackLog.service";
import screenService from "../services/screen.service";
import { emitToCompany } from "../services/socket.service";
import pick from "../utils/pick";

const createPlaybackLog = catchAsync(async (req: Request, res: Response) => {
    // 1. Validate Secret Key (Allow public access if key matches)
    const { screenId, secretKey } = req.body;

    // Pass secretKey to service for validation
    const screen = await screenService.getScreenById(screenId, undefined, secretKey);

    if (!screen) {
        throw new Error("Screen not found or invalid key");
    }

    const payload = {
        ...req.body,
        companyId: screen.companyId
    };

    const log = await playbackLogService.createPlaybackLog(payload);

    if (screen.companyId) {
        emitToCompany(screen.companyId.toString(), "playback_update", log);
    }

    successResponse(res, "Playback logged", httpStatus.CREATED, log);
});

const getPlaybackLogs = catchAsync(async (req: Request, res: Response) => {
    const filter = pick(req.query, ["screenId", "templateId", "contentType"]);
    const options = pick(req.query, ["sortBy", "limit", "page"]);
    const result = await playbackLogService.queryPlaybackLogs(filter, options);
    successResponse(res, "Retrieved logs", httpStatus.OK, result);
});

export default {
    createPlaybackLog,
    getPlaybackLogs,
};
