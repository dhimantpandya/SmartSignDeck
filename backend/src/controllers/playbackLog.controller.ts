import httpStatus from "http-status";
import { type Request, type Response } from "express";
import catchAsync from "../utils/catchAsync";
import successResponse from "../helpers/responses/successResponse";
import playbackLogService from "../services/playbackLog.service";
import pick from "../utils/pick";

const createPlaybackLog = catchAsync(async (req: Request, res: Response) => {
    const log = await playbackLogService.createPlaybackLog(req.body);
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
