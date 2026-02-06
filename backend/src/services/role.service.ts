import httpStatus from "http-status";
import mongoose, { type FilterQuery, type QueryOptions } from "mongoose";
import Role from "../models/role.model";
import { type CustomPaginateResult } from "../models/plugins/paginate.plugin";
import { type IRole, type IRolePermissions } from "../models/role.model";
import ApiError from "../utils/ApiError";
import * as roleConstants from "../utils/constants/role.constants";

const createRole = async (roleBody: IRole): Promise<IRole> => {
  if (await Role.isNameTaken(roleBody.name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, roleConstants.ROLE_TAKEN);
  }
  return await Role.create(roleBody);
};

const queryRole = async (
  filter: FilterQuery<IRole | null>,
  options: QueryOptions,
): Promise<CustomPaginateResult<IRole>> => {
  return await Role.paginate(filter, options);
};

const getRoleById = async (id: string): Promise<IRole | null> => {
  return await Role.findById(id);
};

const getRoleByIdWithPermissions = async (
  id: string,
): Promise<IRolePermissions | null> => {
  return await Role.findById(id).populate("permissions");
};

const updateRoleById = async (
  roleId: string,
  updateBody: Partial<IRole>,
): Promise<IRole> => {
  const role = await getRoleById(roleId);
  if (role == null || role === undefined) {
    throw new ApiError(httpStatus.NOT_FOUND, "Role not found");
  }
  // if name is there in the update body and already exists
  if (
    updateBody.name != null &&
    (await Role.isNameTaken(
      updateBody.name,
      new mongoose.Types.ObjectId(roleId),
    ))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Name already taken");
  }

  Object.assign(role, updateBody);
  await role.save();
  return role;
};

const deleteRoleById = async (roleId: string): Promise<IRole> => {
  const role = await getRoleById(roleId);
  if (role == null || role === undefined) {
    throw new ApiError(httpStatus.NOT_FOUND, "Role not found");
  }
  await Role.deleteOne({ _id: roleId });
  return role;
};

const filterRoles = async (filter: object = {}): Promise<IRole[]> => {
  return await Role.find(filter);
};

export {
  createRole,
  deleteRoleById,
  filterRoles,
  getRoleById,
  getRoleByIdWithPermissions,
  queryRole,
  updateRoleById,
};
