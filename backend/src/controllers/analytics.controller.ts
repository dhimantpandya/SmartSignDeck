import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import analyticsService from "../services/analytics.service";
import successResponse from "../helpers/responses/successResponse";
import ApiError from "../utils/ApiError";

/**
 * Get analytics summary
 * @param {Object} req
 * @param {Object} res
 */
const getAnalyticsSummary = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, userId: queryUserId } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "startDate and endDate are required"
        );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);

    const userRole = (req.user as any)?.role;
    const isPrivileged = ["admin", "super_admin", "advertiser"].includes(userRole);

    // Dynamic Filter: If userId=company AND user is privileged, show company-wide data (userId = undefined)
    // Otherwise, restrict to the specified userId or the requester's own ID.
    let userId: string | undefined = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
    
    if (isPrivileged && queryUserId === "company") {
        userId = undefined;
    } else if (isPrivileged && queryUserId && queryUserId !== "company") {
        userId = queryUserId as string;
    }

    const summary = await analyticsService.getAnalyticsSummary(start, end, req.user!.companyId!.toString(), userId);

    successResponse(
        res,
        "Analytics summary retrieved successfully",
        httpStatus.OK,
        summary
    );
});

/**
 * Get playback statistics by screen
 * @param {Object} req
 * @param {Object} res
 */
const getScreenStats = catchAsync(async (req: Request, res: Response) => {
    const { screenId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "startDate and endDate are required"
        );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);

    const userId = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
    const stats = await analyticsService.getPlaybackStatsByScreen(
        screenId,
        start,
        end,
        req.user!.companyId!.toString(),
        userId?.toString()
    );
    const uptime = await analyticsService.getScreenUptime(
        screenId,
        start,
        end,
        req.user!.companyId!.toString(),
        userId?.toString()
    );

    successResponse(
        res,
        "Screen statistics retrieved successfully",
        httpStatus.OK,
        { ...stats, ...uptime }
    );
});

/**
 * Get playback statistics by template
 * @param {Object} req
 * @param {Object} res
 */
const getTemplateStats = catchAsync(async (req: Request, res: Response) => {
    const { templateId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "startDate and endDate are required"
        );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);

    const userId = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
    const stats = await analyticsService.getPlaybackStatsByTemplate(
        templateId,
        start,
        end,
        req.user!.companyId!.toString(),
        userId?.toString()
    );

    successResponse(
        res,
        "Template statistics retrieved successfully",
        httpStatus.OK,
        stats
    );
});

/**
 * Get content performance
 * @param {Object} req
 * @param {Object} res
 */
const getContentPerformance = catchAsync(
    async (req: Request, res: Response) => {
        const { startDate, endDate, limit, userId: queryUserId } = req.query;

        if (!startDate || !endDate) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "startDate and endDate are required"
            );
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setUTCHours(23, 59, 59, 999);
        const limitNum = limit ? parseInt(limit as string, 10) : 10;

        const userRole = (req.user as any)?.role;
        const isPrivileged = ["admin", "super_admin", "advertiser"].includes(userRole);
        let userId: string | undefined = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
        
        if (isPrivileged && queryUserId === "company") {
            userId = undefined;
        } else if (isPrivileged && queryUserId && queryUserId !== "company") {
            userId = queryUserId as string;
        }

        const performance = await analyticsService.getContentPerformance(
            start,
            end,
            limitNum,
            req.user!.companyId!.toString(),
            userId
        );

        successResponse(
            res,
            "Content performance retrieved successfully",
            httpStatus.OK,
            performance
        );
    }
);

/**
 * Get playback timeline
 * @param {Object} req
 * @param {Object} res
 */
const getPlaybackTimeline = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, interval, userId: queryUserId } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "startDate and endDate are required"
        );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);
    const intervalStr = (interval as string) || "day";

    const userRole = (req.user as any)?.role;
    const isPrivileged = ["admin", "super_admin", "advertiser"].includes(userRole);
    let userId: string | undefined = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
    
    if (isPrivileged && queryUserId === "company") {
        userId = undefined;
    } else if (isPrivileged && queryUserId && queryUserId !== "company") {
        userId = queryUserId as string;
    }

    const timeline = await analyticsService.getPlaybackTimeline(
        start,
        end,
        intervalStr,
        req.user!.companyId!.toString(),
        userId
    );

    successResponse(
        res,
        "Playback timeline retrieved successfully",
        httpStatus.OK,
        timeline
    );
});

/**
 * Get audience demographics summary
 * @param {Object} req
 * @param {Object} res
 */
const getAudienceSummary = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "startDate and endDate are required"
        );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);

    const userId = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
    const summary = await analyticsService.getAudienceSummary(start, end, req.user!.companyId!.toString(), userId);

    successResponse(
        res,
        "Audience summary retrieved successfully",
        httpStatus.OK,
        summary
    );
});

/**
 * Export analytics to CSV
 * @param {Object} req
 * @param {Object} res
 */
const exportCSV = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, userId: queryUserId } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "startDate and endDate are required"
        );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);

    const userRole = (req.user as any)?.role;
    const isPrivileged = ["admin", "super_admin", "advertiser"].includes(userRole);
    let userId: string | undefined = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
    
    if (isPrivileged && queryUserId === "company") {
        userId = undefined;
    } else if (isPrivileged && queryUserId && queryUserId !== "company") {
        userId = queryUserId as string;
    }

    const logs = await analyticsService.getPlaybackLogs(start, end, req.user!.companyId!.toString(), userId);
    const csv = analyticsService.exportLogsToCSV(logs);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=playback-logs-${startDate}-${endDate}.csv`
    );
    res.status(httpStatus.OK).send(csv);
});

/**
 * Export analytics to PDF
 * @param {Object} req
 * @param {Object} res
 */
const exportPDF = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, userId: queryUserId } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "startDate and endDate are required"
        );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setUTCHours(23, 59, 59, 999);

    const userRole = (req.user as any)?.role;
    const isPrivileged = ["admin", "super_admin", "advertiser"].includes(userRole);
    let userId: string | undefined = ((req.user as any)?.id || (req.user as any)?._id)?.toString();
    
    if (isPrivileged && queryUserId === "company") {
        userId = undefined;
    } else if (isPrivileged && queryUserId && queryUserId !== "company") {
        userId = queryUserId as string;
    }

    const summary = await analyticsService.getAnalyticsSummary(start, end, req.user!.companyId!.toString(), userId);
    const performance = await analyticsService.getContentPerformance(start, end, 10, req.user!.companyId!.toString(), userId);
    const pdfBuffer = await analyticsService.generatePDFReport(
        summary,
        performance,
        start,
        end
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=analytics-report-${startDate}-${endDate}.pdf`
    );
    res.status(httpStatus.OK).send(pdfBuffer);
});

export default {
    getAnalyticsSummary,
    getScreenStats,
    getTemplateStats,
    getContentPerformance,
    getPlaybackTimeline,
    exportCSV,
    exportPDF,
    getAudienceSummary,
};
