import express from "express";
import signageController from "../../controllers/signage.controller";

const router = express.Router();

router.get("/stats", signageController.getStats);

export default router;
