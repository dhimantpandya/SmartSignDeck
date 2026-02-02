import express from "express";
import healthController from "../../controllers/health.controller";

const router = express.Router();

/**
 * @route   GET /v1/health
 * @desc    Comprehensive health check
 * @access  Public
 */
router.get("/", healthController.getHealth);

/**
 * @route   GET /v1/health/readiness
 * @desc    Kubernetes readiness probe
 * @access  Public
 */
router.get("/readiness", healthController.getReadiness);

/**
 * @route   GET /v1/health/liveness
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get("/liveness", healthController.getLiveness);

export default router;
