import express from "express";
import auth from "../../middleware/auth";
import audienceController from "../../controllers/audience.controller";

const router = express.Router();

router
    .route("/detect")
    .post(auth("manageScreens"), audienceController.detectDemographics);

export default router;
