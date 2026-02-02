/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from "express";
import * as roleController from "../../controllers/role.controller";
import auth from "../../middleware/auth";
import validate from "../../middleware/validate";
import * as roleValidation from "../../validations/role.validation";

const router: Router = express.Router();

router
  .route("/")
  .get(
    auth("Role", "get_all"),
    validate(roleValidation.getRoleList),
    roleController.getRoleList,
  )
  .post(
    auth("Role", "create"),
    validate(roleValidation.createRole),
    roleController.createRole,
  );

router
  .route("/:roleId")
  .get(
    auth("Role", "get"),
    validate(roleValidation.getRole),
    roleController.getRole,
  )
  .patch(
    auth("Role", "update"),
    validate(roleValidation.updateRole),
    roleController.updateRole,
  )
  .delete(
    auth("Role", "delete"),
    validate(roleValidation.deleteRole),
    roleController.deleteRole,
  );

export default router;

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management and retrieval
 */

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a role
 *     description: Only admins can create other roles.
 *     tags: [Roles]
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
 *               permissions:
 *                 type: array
 *               status:
 *                  type: string
 *                  enum: ['active', 'inactive']
 *             example:
 *               name: admin
 *               description: admin of the whole system
 *               permissions: ["63c91518eba599c477cd83ce"]
 *               status: active
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
 *                   $ref: '#/components/schemas/Roles'
 *       "400":
 *         $ref: '#/components/responses/ValidationError'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all roles.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Role status => 'active', 'inactive'
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *         description: populate from different table.
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Comma separated fields to be returned from the array -1 for remove from response and 1 to have the field in the response.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of roles
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
 *                         $ref: '#/components/schemas/Roles'
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
 * /roles/{roleId}:
 *   get:
 *     summary: Get a role
 *     description: Logged in user can only their own role information. Only admins can fetch other roles.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role id
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
 *                   $ref: '#/components/schemas/Roles'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a role
 *     description: Logged in roles can only update their own information. Only admins can update other roles.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role id
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
 *                 description: title of Role
 *               completed:
 *                 type: boolean
 *                 description: completed status of the Role
 *               status:
 *                  type: string
 *                  enum: ['COMPLETED', 'INPROGRESS', 'PENDING']
 *                  description: status of the Role
 *               hours:
 *                  type: number
 *                  description: hours required to complete the Role
 *               subtask:
 *                 type: array
 *                 description: sub tasks of thr Role
 *               relatedTasks:
 *                 type: object
 *                 description: related tasks of the Role
 *               completeBy:
 *                 type: date
 *                 description: Role completion date
 *             example:
 *               userId: 63c0ea83fa8bc025ea0ed91c
 *               title: Role-1
 *               completed: false
 *               hours: 2
 *               subtask: [{"title":"sub-Role-1.1","description":"sub todo one.1"},{"title":"sub-Role-1.2","description":"sub todo one.2"}]
 *               relatedTasks: {"taskId":"63c91518eba599c477cd83ce","taskTitle":"Role-1 "}
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
 *                   $ref: '#/components/schemas/Roles'
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
 *     summary: Delete a role
 *     description: Logged in user can delete only own roles. Only admins can delete other roles.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role id
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
