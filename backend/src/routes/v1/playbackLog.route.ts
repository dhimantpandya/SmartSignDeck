import express from "express";
import auth from "../../middleware/auth";
import validate from "../../middleware/validate";
import playbackLogController from "../../controllers/playbackLog.controller";

const router = express.Router();

router
    .route("/")
    .post(playbackLogController.createPlaybackLog)
    .get(auth("getAnalytics"), playbackLogController.getPlaybackLogs);

export default router;
