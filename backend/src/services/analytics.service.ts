import httpStatus from "http-status";
import mongoose from "mongoose";
import PlaybackLog from "../models/playbackLog.model";
import ApiError from "../utils/ApiError";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import { format, eachDayOfInterval } from "date-fns";

/**
 * Get playback statistics by screen
 * @param {string} screenId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getPlaybackStatsByScreen = async (
    screenId: string,
    startDate: Date,
    endDate: Date,
    companyId: string
) => {
    const stats = await PlaybackLog.aggregate([
        {
            $match: {
                screenId,
                companyId: new mongoose.Types.ObjectId(companyId),
                startTime: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                totalPlays: { $sum: 1 },
                totalDuration: { $sum: "$duration" },
                avgDuration: { $avg: "$duration" },
            },
        },
    ]);

    return stats.length > 0
        ? stats[0]
        : { totalPlays: 0, totalDuration: 0, avgDuration: 0 };
};

/**
 * Get playback statistics by template
 * @param {string} templateId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getPlaybackStatsByTemplate = async (
    templateId: string,
    startDate: Date,
    endDate: Date,
    companyId: string
) => {
    const stats = await PlaybackLog.aggregate([
        {
            $match: {
                templateId,
                companyId: new mongoose.Types.ObjectId(companyId),
                startTime: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                totalPlays: { $sum: 1 },
                totalDuration: { $sum: "$duration" },
                avgDuration: { $avg: "$duration" },
                uniqueScreens: { $addToSet: "$screenId" },
            },
        },
        {
            $project: {
                totalPlays: 1,
                totalDuration: 1,
                avgDuration: 1,
                uniqueScreenCount: { $size: "$uniqueScreens" },
            },
        },
    ]);

    return stats.length > 0
        ? stats[0]
        : { totalPlays: 0, totalDuration: 0, avgDuration: 0, uniqueScreenCount: 0 };
};

/**
 * Get content performance (top performing content URLs)
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getContentPerformance = async (
    startDate: Date,
    endDate: Date,
    limit: number = 10,
    companyId: string
) => {
    const performance = await PlaybackLog.aggregate([
        {
            $match: {
                companyId: new mongoose.Types.ObjectId(companyId),
                startTime: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: {
                    contentUrl: "$contentUrl",
                    contentType: "$contentType",
                },
                totalPlays: { $sum: 1 },
                totalDuration: { $sum: "$duration" },
                avgDuration: { $avg: "$duration" },
                screens: { $addToSet: "$screenId" },
            },
        },
        {
            $project: {
                contentUrl: "$_id.contentUrl",
                contentType: "$_id.contentType",
                totalPlays: 1,
                totalDuration: 1,
                avgDuration: 1,
                screenCount: { $size: "$screens" },
            },
        },
        { $sort: { totalPlays: -1 } },
        { $limit: limit },
    ]);

    return performance;
};

/**
 * Get screen uptime statistics
 * @param {string} screenId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getScreenUptime = async (
    screenId: string,
    startDate: Date,
    endDate: Date,
    companyId: string
) => {
    const logs = await PlaybackLog.find({
        screenId,
        companyId: new mongoose.Types.ObjectId(companyId),
        startTime: { $gte: startDate, $lte: endDate },
    }).sort({ startTime: 1 });

    if (logs.length === 0) {
        return { uptimePercentage: 0, totalUptime: 0, totalDowntime: 0 };
    }

    const totalPeriod = endDate.getTime() - startDate.getTime();
    let totalUptime = 0;

    // Calculate uptime based on playback activity
    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        totalUptime += log.duration || 0;
    }

    const uptimePercentage = (totalUptime / totalPeriod) * 100;
    const totalDowntime = totalPeriod - totalUptime;

    return {
        uptimePercentage: Math.min(uptimePercentage, 100),
        totalUptime,
        totalDowntime,
    };
};

/**
 * Get playback timeline (plays over time)
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} interval - 'hour', 'day', 'week'
 * @returns {Promise<Array>}
 */
const getPlaybackTimeline = async (
    startDate: Date,
    endDate: Date,
    interval: string = "day",
    companyId: string
) => {
    let dateFormat: any;

    switch (interval) {
        case "hour":
            dateFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$startTime" } };
            break;
        case "week":
            dateFormat = { $dateToString: { format: "%Y-W%V", date: "$startTime" } };
            break;
        default: // day
            dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } };
    }

    const timeline = await PlaybackLog.aggregate([
        {
            $match: {
                companyId: new mongoose.Types.ObjectId(companyId),
                startTime: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: dateFormat,
                plays: { $sum: 1 },
                duration: { $sum: "$duration" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Fill missing dates with 0 (Timezone-safe UTC approach)
    const timelineMap = new Map(timeline.map(item => [item._id, item]));
    const result = [];

    if (interval === "day") {
        let current = new Date(startDate);
        // Ensure current is at start of UTC day
        current.setUTCHours(0, 0, 0, 0);

        // Use a safety counter to avoid infinite loops if dates are messed up
        let safety = 0;
        while (current <= endDate && safety < 1000) {
            const dateKey = current.toISOString().split('T')[0];
            const existing = timelineMap.get(dateKey);

            result.push({
                period: dateKey,
                plays: existing ? existing.plays : 0,
                duration: existing ? existing.duration : 0,
            });

            current.setUTCDate(current.getUTCDate() + 1);
            safety++;
        }
    } else {
        return timeline.map((item) => ({
            period: item._id,
            plays: item.plays,
            duration: item.duration,
        }));
    }

    return result;
};

/**
 * Get overall analytics summary
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
const getAnalyticsSummary = async (startDate: Date, endDate: Date, companyId: string) => {
    const matchQuery = {
        companyId: new mongoose.Types.ObjectId(companyId),
        startTime: { $gte: startDate, $lte: endDate },
    };

    const summaryResults = await PlaybackLog.aggregate([
        {
            $match: matchQuery,
        },
        {
            $group: {
                _id: null,
                totalPlays: { $sum: 1 },
                totalDuration: { $sum: "$duration" },
                avgDuration: { $avg: "$duration" },
                uniqueScreens: { $addToSet: "$screenId" },
                uniqueTemplates: { $addToSet: "$templateId" },
                uniqueContent: { $addToSet: "$contentUrl" },
            },
        },
        {
            $project: {
                totalPlays: 1,
                totalDuration: 1,
                avgDuration: 1,
                activeScreens: { $size: "$uniqueScreens" },
                activeTemplates: { $size: "$uniqueTemplates" },
                uniqueContentCount: { $size: "$uniqueContent" },
            },
        },
    ]);


    return summaryResults.length > 0
        ? summaryResults[0]
        : {
            totalPlays: 0,
            totalDuration: 0,
            avgDuration: 0,
            activeScreens: 0,
            activeTemplates: 0,
            uniqueContentCount: 0,
        };
};

/**
 * Get audience demographics summary
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>}
 */
const getAudienceSummary = async (startDate: Date, endDate: Date, companyId: string) => {
    const summary = await PlaybackLog.aggregate([
        {
            $match: {
                companyId: new mongoose.Types.ObjectId(companyId),
                startTime: { $gte: startDate, $lte: endDate },
                "demographics.ageRange": { $exists: true },
            },
        },
        {
            $group: {
                _id: {
                    ageRange: "$demographics.ageRange",
                    gender: "$demographics.gender",
                },
                totalPlays: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                ageRange: "$_id.ageRange",
                gender: "$_id.gender",
                totalPlays: 1,
            },
        },
    ]);
    return summary;
};

/**
 * Get raw playback logs for export
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>}
 */
const getPlaybackLogs = async (startDate: Date, endDate: Date, companyId: string) => {
    return PlaybackLog.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        startTime: { $gte: startDate, $lte: endDate },
    }).populate("screenId", "name location").populate("templateId", "name").sort({ startTime: -1 });
};

/**
 * Export logs to CSV
 * @param {Array} logs
 * @returns {string}
 */
const exportLogsToCSV = (logs: any[]) => {
    const fields = [
        { label: "Screen Name", value: "screenId.name" },
        { label: "Location", value: "screenId.location" },
        { label: "Template", value: "templateId.name" },
        { label: "Content URL", value: "contentUrl" },
        { label: "Type", value: "contentType" },
        { label: "Start Time", value: (row: any) => format(row.startTime, "yyyy-MM-dd HH:mm:ss") },
        { label: "End Time", value: (row: any) => row.endTime ? format(row.endTime, "yyyy-MM-dd HH:mm:ss") : "N/A" },
        { label: "Duration (s)", value: "duration" },
    ];

    const parser = new Parser({ fields });
    return parser.parse(logs);
};

/**
 * Generate PDF Analytics Report
 * @param {Object} summary
 * @param {Array} performance
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Buffer>}
 */
const generatePDFReport = async (
    summary: any,
    performance: any[],
    startDate: Date,
    endDate: Date
): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, bufferPages: true });
        const buffers: any[] = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", (err) => reject(err));

        // Header
        doc.fontSize(25).text("SmartSignDeck Analytics Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${format(startDate, "PPP")} to ${format(endDate, "PPP")}`, { align: "center" });
        doc.moveDown();
        doc.rect(50, doc.y, 500, 2).fill("#333");
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(18).text("Summary Metrics", { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Plays: ${summary.totalPlays || 0}`);
        doc.text(`Total Playback Duration: ${Math.floor((summary.totalDuration || 0) / 60)} minutes`);
        doc.text(`Active Screens: ${summary.activeScreens || 0}`);
        doc.text(`Average Playback Duration: ${summary.avgDuration?.toFixed(1) || 0} seconds`);
        doc.moveDown(2);

        // Top Content Section
        doc.fontSize(18).text("Top Performing Content", { underline: true });
        doc.moveDown();

        // Table Header
        const tableTop = doc.y;
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Content URL", 50, tableTop);
        doc.text("Type", 300, tableTop);
        doc.text("Plays", 400, tableTop);
        doc.text("Duration (s)", 480, tableTop);

        doc.moveDown();
        doc.rect(50, doc.y, 500, 1).fill("#999");
        doc.moveDown();

        doc.font("Helvetica");
        performance.forEach((item, index) => {
            const y = doc.y;
            if (y > 700) doc.addPage();

            const url = item.contentUrl.length > 40 ? item.contentUrl.substring(0, 37) + "..." : item.contentUrl;
            doc.text(url, 50, doc.y);
            doc.text(item.contentType, 300, y);
            doc.text(item.totalPlays.toString(), 400, y);
            doc.text(item.totalDuration.toString(), 480, y);
            doc.moveDown();
        });

        // Footer
        const pageCount = (doc as any).bufferedPageCount;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(10).text(
                `Generated on ${format(new Date(), "PPP HH:mm")}`,
                50,
                doc.page.height - 50,
                { align: "center" }
            );
        }

        doc.end();
    });
};

export default {
    getPlaybackStatsByScreen,
    getPlaybackStatsByTemplate,
    getContentPerformance,
    getScreenUptime,
    getPlaybackTimeline,
    getAnalyticsSummary,
    getPlaybackLogs,
    exportLogsToCSV,
    generatePDFReport,
    getAudienceSummary,
};
