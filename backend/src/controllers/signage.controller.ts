import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import catchAsync from "../utils/catchAsync";
import signageService from "../services/signage.service";

const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await signageService.getSignageStats();
  successResponse(
    res,
    "Signage stats retrieved successfully",
    httpStatus.OK,
    stats,
  );
});

export default {
  getStats,
};
