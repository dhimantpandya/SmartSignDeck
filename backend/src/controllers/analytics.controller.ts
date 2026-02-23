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

    console.log(`[DEBUG] Analytics Request:`);
    console.log(`- User Company ID: ${req.user!.companyId}`);
    console.log(`- Query Start Date: ${start.toISOString()} (${startDate})`);
    console.log(`- Query End Date: ${end.toISOString()} (${endDate})`);

    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const summary = await analyticsService.getAnalyticsSummary(start, end, req.user!.companyId!.toString(), userId?.toString());

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

    const userId = (req.user as any)?.id || (req.user as any)?._id;
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

    const userId = (req.user as any)?.id || (req.user as any)?._id;
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
        const { startDate, endDate, limit } = req.query;

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

        const userId = (req.user as any)?.id || (req.user as any)?._id;
        const performance = await analyticsService.getContentPerformance(
            start,
            end,
            limitNum,
            req.user!.companyId!.toString(),
            userId?.toString()
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
    const { startDate, endDate, interval } = req.query;

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

    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const timeline = await analyticsService.getPlaybackTimeline(
        start,
        end,
        intervalStr,
        req.user!.companyId!.toString(),
        userId?.toString()
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

    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const summary = await analyticsService.getAudienceSummary(start, end, req.user!.companyId!.toString(), userId?.toString());

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

    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const logs = await analyticsService.getPlaybackLogs(start, end, req.user!.companyId!.toString(), userId?.toString());
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

    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const summary = await analyticsService.getAnalyticsSummary(start, end, req.user!.companyId!.toString(), userId?.toString());
    const performance = await analyticsService.getContentPerformance(start, end, 10, req.user!.companyId!.toString(), userId?.toString());
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
