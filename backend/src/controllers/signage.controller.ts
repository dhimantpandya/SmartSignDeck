import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import catchAsync from "../utils/catchAsync";
import signageService from "../services/signage.service";

const getStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const companyId = user?.companyId?.toString();
  const scope = (req.query.scope as "personal" | "company") || "personal";

  console.log(`[DEBUG] Fetching signage stats. User: ${user?.id}, Role: ${user?.role}, Scope: ${scope}`);

  const userId = (user?.id || user?._id)?.toString();

  let stats;
  if (!companyId && user?.role === "super_admin") {
    stats = await signageService.getSignageStats("", userId as string, scope);
  } else if (!companyId) {
    stats = {
      totalTemplates: 0,
      totalScreens: 0,
      onlineScreens: 0,
      offlineScreens: 0,
    };
  } else {
    stats = await signageService.getSignageStats(companyId, userId as string, scope);
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
