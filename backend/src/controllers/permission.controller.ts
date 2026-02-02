import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { MongooseQueryParser } from "mongoose-query-parser";
import successResponse from "../helpers/responses/successResponse";
import * as permissionService from "../services/permission.service";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import * as constants from "../utils/constants/constants";
import * as permissionConstant from "../utils/constants/permission.constants";
import pick from "../utils/pick";

const createPermission = catchAsync(async (req: Request, res: Response) => {
  const permission = await permissionService.createPermission(req.body);
  if (permission !== null && permission !== undefined) {
    successResponse(
      res,
      permissionConstant.PERMISSION_CREATED,
      httpStatus.CREATED,
      permission,
    );
  }
});

const getPermissionList = catchAsync(async (req: Request, res: Response) => {
  const parsedQuery = new MongooseQueryParser().parse(req.query);

  const filter = pick(req.query, [
    "_id",
    "name",
    "description",
    "resource",
    "action",
    "status",
  ]);
  const options = pick(parsedQuery, [
    "skip",
    "limit",
    "select",
    "sort",
    "populate",
  ]);
  const result = await permissionService.queryPermission(filter, options);
  successResponse(res, constants.RETRIEVED, httpStatus.OK, result);
});

const getPermission = catchAsync(async (req: Request, res: Response) => {
  const permission = await permissionService.getPermissionById(
    req.params.permissionId,
  );
  if (permission === null || permission === undefined) {
    throw new ApiError(httpStatus.NOT_FOUND, constants.NOT_FOUND);
  }
  successResponse(res, constants.RETRIEVED, httpStatus.OK, permission);
});

const updatePermission = catchAsync(async (req: Request, res: Response) => {
  const permission = await permissionService.updatePermissionById(
    req.params.permissionId,
    req.body,
  );
  if (permission !== null && permission !== undefined) {
    successResponse(
      res,
      permissionConstant.PERMISSION_CREATED,
      httpStatus.OK,
      permission,
    );
  }
});

const deletePermission = catchAsync(async (req: Request, res: Response) => {
  await permissionService.deletePermissionById(req.params.permissionId);
  successResponse(
    res,
    permissionConstant.PERMISSION_CREATED,
    httpStatus.NO_CONTENT,
    {},
  );
});

export {
  createPermission,
  deletePermission,
  getPermission,
  getPermissionList,
  updatePermission,
};
