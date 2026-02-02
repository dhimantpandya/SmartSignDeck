import { type Request } from "express";
import httpStatus from "http-status";
import { type DeleteResult } from "mongodb";
import mongoose, { type FilterQuery, type QueryOptions } from "mongoose";
import { User } from "../models";
import { type CustomPaginateResult } from "../models/plugins/paginate.plugin";
import { type IUser } from "../models/user.model";
import ApiError from "../utils/ApiError";
import * as AuthConstants from "../utils/constants/auth.constants";
import { filterRoles } from "./role.service";
import config from "../config/config";

// ===== FIXED createUser to accept Partial<IUser> =====
const createUser = async (userBody: Partial<IUser>): Promise<IUser> => {
  const userData = { ...userBody };

  if (!userData.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
  }
  if (await User.isEmailTaken(userData.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, AuthConstants.EMAIL_TAKEN);
  }

  if (!("role" in userData)) {
    const roles = await filterRoles({ name: "user" });
    if (roles.length > 0) {
      userData.role = roles[0].name as IUser["role"];
    }
  }

  // Mongoose will create the full IUser document
  const user = await User.create(userData);
  return user;
};

const queryUsers = async (
  filter: FilterQuery<IUser>,
  options: QueryOptions,
): Promise<CustomPaginateResult<IUser>> => {
  return await User.paginate(filter, options);
};

const getUserByEmail = async (email: string): Promise<IUser | null> => {
  return await User.findOne({ email });
};

const getUserById = async (id: string): Promise<IUser | null> => {
  return await User.findById(id);
};

const updateUserById = async (
  userId: string,
  updateBody: Partial<IUser>,
): Promise<IUser> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (
    updateBody.email != null &&
    (await User.isEmailTaken(
      updateBody.email,
      new mongoose.Types.ObjectId(userId),
    ))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUserById = async (userId: string): Promise<DeleteResult> => {
  return await User.deleteOne({ _id: userId });
};

const fetchAndValidateUser = async (req: Request): Promise<IUser> => {
  const user = await getUserById(req.params.userId);
  const currentUser = req.user as any;
  if (
    !user ||
    (currentUser?.role === "user" &&
      currentUser?._id?.toString() !== user._id.toString())
  ) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};
export {
  createUser,
  queryUsers,
  getUserByEmail,
  getUserById,
  updateUserById,
  deleteUserById,
  fetchAndValidateUser,
};
