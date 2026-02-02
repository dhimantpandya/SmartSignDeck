import express from "express";
import auth from "../../middleware/auth";
import analyticsController from "../../controllers/analytics.controller";

const router = express.Router();

router
    .route("/summary")
    .get(auth("admin"), analyticsController.getAnalyticsSummary);

router
    .route("/screens/:screenId")
    .get(auth("admin"), analyticsController.getScreenStats);

router
    .route("/templates/:templateId")
    .get(auth("admin"), analyticsController.getTemplateStats);

router
    .route("/content")
    .get(auth("admin"), analyticsController.getContentPerformance);

router
    .route("/timeline")
    .get(auth("admin"), analyticsController.getPlaybackTimeline);

router
    .route("/audience")
    .get(auth("admin"), analyticsController.getAudienceSummary);

router
    .route("/export/csv")
    .get(auth("admin"), analyticsController.exportCSV);

router
    .route("/export/pdf")
    .get(auth("admin"), analyticsController.exportPDF);

export default router;
