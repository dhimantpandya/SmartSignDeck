/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from "express";
import { generalController } from "../../controllers";
import auth from "../../middleware/auth";
import validate from "../../middleware/validate";
import { generalValidation } from "../../validations";

const router: Router = express.Router();

router
  .route("/generate-view-url")
  .post(
    auth(),
    validate(generalValidation.generateS3PresignedViewURL),
    generalController.generateS3PresignedViewURL,
  );

router
  .route("/generate-upload-url")
  .post(
    auth(),
    validate(generalValidation.generateS3PresignedUploadURL),
    generalController.generateS3PresignedUploadURL,
  );

export default router;

/**
 * @swagger
 * tags:
 *   name: General
 *   description: Common route
 */

/**
 * @swagger
 * /generate-upload-url:
 *   post:
 *     summary: Generate upload url
 *     description: Generate url for file upload in AWS s3
 *     tags: [General]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               object_key:
 *                 type: string
 *                 example: "6669747c59f4947102c6c39a/6669747c59f4947102c6c39a.jpg"
 *               mime_type:
 *                 type: string
 *                 example: "image/jpg"
 *             example:
 *               object_key: 6669747c59f4947102c6c39a/6669747c59f4947102c6c39a.jpg
 *               example: image/jpg
 *     responses:
 *       "200":
 *         description: Presigned URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Presigned url generated
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://test-assets.s3.us-east-1.amazonaws.com/6669747c59f4947102c6c39a/6669747c59f4947102c6c39a.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAZI2LII5VRHYDB7EM/20240625/us-east-1/s3/aws4_request&X-Amz-Date=20240625T055341Z&X-Amz-Expires=60&X-Amz-Signature=e3b72277c46fccfa0a47b17fe2b1a8b78608b2aa8221bb0e0141cecd5ebcdbb2&X-Amz-SignedHeaders=host&x-id=PutObject"
 *       "400":
 *         $ref: '#/components/responses/ValidationError'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 */

/**
 * @swagger
 * /generate-view-url:
 *   post:
 *     summary: Image View URL Generation API
 *     description: API for generating presigned URLs for viewing multiple images
 *     tags: [General]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               object_keys:
 *                 type: array
 *                 items:
 *                  type: string
 *                 example: ["6669747c59f4947102c6c39a/6669747c59f4947102c6c39a.jpg"]
 *     responses:
 *       "200":
 *         description: Presigned URLs generate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Presigned url generated
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                      type: object
 *                      properties:
 *                        key:
 *                          type: string
 *                          example: test.png
 *                        url:
 *                          type: string
 *       "400":
 *         $ref: '#/components/responses/ValidationError'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 */
