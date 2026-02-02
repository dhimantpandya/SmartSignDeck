import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { MongooseQueryParser } from "mongoose-query-parser";
import successResponse from "../helpers/responses/successResponse";
import { roleService } from "../services";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import * as constants from "../utils/constants/constants";
import * as roleConstant from "../utils/constants/role.constants";
import pick from "../utils/pick";

const createRole = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.createRole(req.body);
  if (role !== null && role !== undefined) {
    successResponse(res, roleConstant.ROLE_CREATED, httpStatus.CREATED, role);
  }
});

const getRoleList = catchAsync(async (req: Request, res: Response) => {
  const parsedQuery = new MongooseQueryParser().parse(req.query);

  const filter = pick(req.query, ["_id", "name", "description", "status"]);
  const options = pick(parsedQuery, [
    "skip",
    "limit",
    "select",
    "sort",
    "populate",
  ]);
  const result = await roleService.queryRole(filter, options);
  successResponse(res, constants.RETRIEVED, httpStatus.OK, result);
});

const getRole = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.getRoleById(req.params.roleId);
  if (role !== null && role !== undefined) {
    successResponse(res, constants.RETRIEVED, httpStatus.OK, role);
    return;
  }
  throw new ApiError(httpStatus.NOT_FOUND, constants.NOT_FOUND);
});

const updateRole = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.updateRoleById(req.params.roleId, req.body);
  successResponse(res, roleConstant.ROLE_UPDATED, httpStatus.OK, role);
});

const deleteRole = catchAsync(async (req: Request, res: Response) => {
  await roleService.deleteRoleById(req.params.roleId);
  successResponse(res, roleConstant.ROLE_DELETED, httpStatus.NO_CONTENT, {});
});

export { createRole, deleteRole, getRole, getRoleList, updateRole };
