import httpStatus from "http-status";
import mongoose, { type FilterQuery, type QueryOptions } from "mongoose";
import { Permission } from "../models";
import { type IPermission } from "../models/permission.model";
import { type CustomPaginateResult } from "../models/plugins/paginate.plugin";
import ApiError from "../utils/ApiError";
import * as permissionConstants from "../utils/constants/permission.constants";

const createPermission = async (
  permissionBody: IPermission,
): Promise<IPermission> => {
  if (await Permission.isNameTaken(permissionBody.name)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      permissionConstants.PERMISSION_TAKEN,
    );
  }
  return await Permission.create(permissionBody);
};

const queryPermission = async (
  filter: FilterQuery<IPermission>,
  options: QueryOptions,
): Promise<CustomPaginateResult<IPermission>> => {
  return await Permission.paginate(filter, options);
};

const getPermissionById = async (id: string): Promise<IPermission | null> => {
  return await Permission.findById(id);
};

const updatePermissionById = async (
  permissionId: string,
  updateBody: Partial<IPermission>,
): Promise<IPermission | null> => {
  const permission = await getPermissionById(permissionId);
  if (permission == null || permission === undefined) {
    throw new ApiError(httpStatus.NOT_FOUND, "Permission not found");
  }

  // if name is there in the update body and already exists
  if (
    updateBody.name != null &&
    (await Permission.isNameTaken(
      updateBody.name,
      new mongoose.Types.ObjectId(permissionId),
    ))
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      permissionConstants.PERMISSION_TAKEN,
    );
  }

  Object.assign(permission, updateBody);
  await permission.save();
  return permission;
};

const deletePermissionById = async (
  permissionId: string,
): Promise<IPermission> => {
  const permission = await getPermissionById(permissionId);
  if (permission == null || permission === undefined) {
    throw new ApiError(httpStatus.NOT_FOUND, "Permission not found");
  }
  await Permission.deleteOne({ _id: permissionId });

  return permission;
};

export {
  createPermission,
  deletePermissionById,
  getPermissionById,
  queryPermission,
  updatePermissionById,
};
