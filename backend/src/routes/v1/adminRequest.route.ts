import express, { type Router } from "express";
import { adminRequestController } from "../../controllers";
import auth from "../../middleware/auth";

const router: Router = express.Router();

router
    .route("/")
    .post(auth("manageUsers"), adminRequestController.createRequest)
    .get(auth("manageUsers"), adminRequestController.getRequests);

router
    .route("/:requestId/process")
    .post(auth("super_admin"), adminRequestController.processRequest);

export default router;
