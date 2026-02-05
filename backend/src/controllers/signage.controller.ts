import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import catchAsync from "../utils/catchAsync";
import signageService from "../services/signage.service";

const getStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const companyId = user?.companyId?.toString();

  console.log(`[DEBUG] Fetching signage stats for user: ${user?.id}, companyId: ${companyId}, role: ${user?.role}`);

  let stats;
  const userId = (user?.id || user?._id)?.toString();

  if (!companyId && user?.role === "super_admin") {
    // Super-admin without company sees everything
    stats = await signageService.getSignageStats("", userId);
  } else if (!companyId) {
    // Fallback if somehow companyId is missing for regular users
    stats = {
      totalTemplates: 0,
      totalScreens: 0,
      onlineScreens: 0,
      offlineScreens: 0,
    };
  } else {
    stats = await signageService.getSignageStats(companyId, userId);
  }

  successResponse(
    res,
    "Signage stats retrieved successfully",
    httpStatus.OK,
    {
      ...stats,
      _debug: {
        companyId,
        userId: user?.id || user?._id,
        role: user?.role
      }
    },
  );
});

export default {
  getStats,
};
