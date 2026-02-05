import express from "express";
import auth from "../../middleware/auth";
import analyticsController from "../../controllers/analytics.controller";

const router = express.Router();

router
    .route("/summary")
    .get(auth("getAnalytics"), analyticsController.getAnalyticsSummary);

router
    .route("/screens/:screenId")
    .get(auth("getAnalytics"), analyticsController.getScreenStats);

router
    .route("/templates/:templateId")
    .get(auth("getAnalytics"), analyticsController.getTemplateStats);

router
    .route("/content")
    .get(auth("getAnalytics"), analyticsController.getContentPerformance);

router
    .route("/timeline")
    .get(auth("getAnalytics"), analyticsController.getPlaybackTimeline);

router
    .route("/audience")
    .get(auth("getAnalytics"), analyticsController.getAudienceSummary);

router
    .route("/export/csv")
    .get(auth("manageAnalytics"), analyticsController.exportCSV);

router
    .route("/export/pdf")
    .get(auth("manageAnalytics"), analyticsController.exportPDF);

export default router;

