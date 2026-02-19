import express from "express";
import auth from "../../middleware/auth";
import validate from "../../middleware/validate";
import collaborationRequestValidation from "../../validations/collaborationRequest.validation";
import collaborationRequestController from "../../controllers/collaborationRequest.controller";

const router = express.Router();

router
    .route("/")
    .post(auth(), validate(collaborationRequestValidation.sendRequest), collaborationRequestController.sendRequest)
    .get(auth(), validate(collaborationRequestValidation.getRequests), collaborationRequestController.getRequests);

router
    .route("/:requestId/respond")
    .post(auth(), validate(collaborationRequestValidation.respondToRequest), collaborationRequestController.respondToRequest);

router
    .route("/:requestId/cancel")
    .post(auth(), validate(collaborationRequestValidation.cancelRequest), collaborationRequestController.cancelRequest);

export default router;
/**
 * @swagger
 * tags:
 *   name: CollaborationRequests
 *   description: Template collaboration request management
 */

/**
 * @swagger
 * /collaboration-requests:
 *   post:
 *     summary: Send a collaboration request
 *     tags: [CollaborationRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - templateId
 *             properties:
 *               recipientId:
 *                 type: string
 *               templateId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Created
 *   get:
 *     summary: Get collaboration requests
 *     tags: [CollaborationRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [incoming, outgoing]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, cancelled]
 *     responses:
 *       "200":
 *         description: OK
 */
