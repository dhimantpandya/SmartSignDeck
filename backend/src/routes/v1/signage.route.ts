import express from "express";
import signageController from "../../controllers/signage.controller";
import auth from "../../middleware/auth";

const router = express.Router();

router.get("/stats", auth(), signageController.getStats);

export default router;
