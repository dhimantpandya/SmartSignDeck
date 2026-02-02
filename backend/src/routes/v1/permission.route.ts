/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from "express";
import * as permissionController from "../../controllers/permission.controller";
import auth from "../../middleware/auth";
import validate from "../../middleware/validate";
import * as permissionValidation from "../../validations/permission.validation";

const router: Router = express.Router();

router
  .route("/")
  .get(
    auth("Permission", "get_all"),
    validate(permissionValidation.getPermissionList),
    permissionController.getPermissionList,
  )
  .post(
    auth("Permission", "create"),
    validate(permissionValidation.createPermission),
    permissionController.createPermission,
  );

router
  .route("/:permissionId")
  .get(
    auth("Permission", "get"),
    validate(permissionValidation.getPermission),
    permissionController.getPermission,
  )
  .patch(
    auth("Permission", "update"),
    validate(permissionValidation.updatePermission),
    permissionController.updatePermission,
  )
  .delete(
    auth("Permission", "delete"),
    validate(permissionValidation.deletePermission),
    permissionController.deletePermission,
  );

export default router;

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management and retrieval
 */

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create a permission
 *     description: Only admins can create other permissions.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               resource:
 *                 type: string
 *               action:
 *                  enum: ['create', 'update', 'delete', 'get', 'get_all']
 *               status:
 *                  type: string
 *                  enum: ['active', 'inactive']
 *             example:
 *               name: Create user
 *               description: Can create the new user
 *               resource: User
 *               action: create
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Created
 *                 status:
 *                   type: number
 *                   example: 201
 *                 data:
 *                   type: object
 *                   $ref: '#/components/schemas/Permissions'
 *       "400":
 *         $ref: '#/components/responses/ValidationError'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve all permissions.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: name
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: resource name
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum:
 *            - create
 *            - update
 *            - delete
 *            - get
 *            - get_all
 *         description: action of the permission
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *            - active
 *            - inactive
 *         description: Permission status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: comma-separated list of fields. sort=-name,created_at. Default behavior is to sort in ascending order. Use - prefixes to sort in descending order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of permissions
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Retrieved
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permissions'
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     totalResults:
 *                       type: integer
 *                       example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /permissions/{permissionId}:
 *   get:
 *     summary: Get a permission
 *     description: Logged in user can only their own permission information. Only admins can fetch other permissions.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Retrieved!
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   $ref: '#/components/schemas/Permissions'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a permission
 *     description: Logged in permissions can only update their own information. Only admins can update other permissions.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: user's id
 *               title:
 *                 type: string
 *                 description: title of Permission
 *               completed:
 *                 type: boolean
 *                 description: completed status of the Permission
 *               status:
 *                  type: string
 *                  enum: ['COMPLETED', 'INPROGRESS', 'PENDING']
 *                  description: status of the Permission
 *               hours:
 *                  type: number
 *                  description: hours required to complete the Permission
 *               subtask:
 *                 type: array
 *                 description: sub tasks of thr Permission
 *               relatedTasks:
 *                 type: object
 *                 description: related tasks of the Permission
 *               completeBy:
 *                 type: date
 *                 description: Permission completion date
 *             example:
 *               userId: 63c0ea83fa8bc025ea0ed91c
 *               title: Permission-1
 *               completed: false
 *               hours: 2
 *               subtask: [{"title":"sub-Permission-1.1","description":"sub todo one.1"},{"title":"sub-Permission-1.2","description":"sub todo one.2"}]
 *               relatedTasks: {"taskId":"63c91518eba599c477cd83ce","taskTitle":"Permission-1 "}
 *               completeBy: "2023-10-24T18:05:47.000Z"
 *               status: PENDING
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Updated
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/Permissions'
 *       "400":
 *         $ref: '#/components/responses/ValidationError'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a permission
 *     description: Logged in user can delete only own permissions. Only admins can delete other permissions.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission id
 *     responses:
 *       "200":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
