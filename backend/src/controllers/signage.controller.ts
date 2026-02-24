import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import catchAsync from "../utils/catchAsync";
import signageService from "../services/signage.service";

const getStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const companyId = user?.companyId?.toString();

  console.log(`[DEBUG] Fetching signage stats for user: ${user?.id}, companyId: ${companyId}, role: ${user?.role}`);

  // 🔒 Dashboard stats are ALWAYS personal: show only what this user created.
  // Even admins see their own content count (0 for new users).
  // Company-wide management is done on the template/screen management pages.
  const userId = (user?.id || user?._id)?.toString();

  let stats;

  if (!companyId && user?.role === "super_admin") {
    // Super-admin without company: show their own content
    stats = await signageService.getSignageStats("", userId as string);
  } else if (!companyId) {
    // Fallback if somehow companyId is missing for regular users
    stats = {
      totalTemplates: 0,
      totalScreens: 0,
      onlineScreens: 0,
      offlineScreens: 0,
    };
  } else {
    // Always filter by userId so new invited users (even admins) see 0 until they create content
    stats = await signageService.getSignageStats(companyId, userId as string);
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

const getActiveContent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const companyId = user?.companyId?.toString();

  const userId = (user?.id || user?._id)?.toString();
  const activeContent = await signageService.getActiveContent(companyId || "", userId);

  successResponse(
    res,
    "Active displays retrieved successfully",
    httpStatus.OK,
    activeContent
  );
});

export default {
  getStats,
  getActiveContent
};
