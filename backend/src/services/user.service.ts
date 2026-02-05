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
  console.log(`[UserDebug] createUser for email: "${userBody.email}"`);
  const userData = { ...userBody };

  // Clean up empty strings for ObjectId fields to avoid BSONError
  if ((userData as any).companyId === "" || userData.companyId === null) {
    delete userData.companyId;
  }

  try {
    if (!userData.email) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
    }
    // Normalize email
    userData.email = userData.email.toLowerCase();

    if (await User.isEmailTaken(userData.email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, AuthConstants.EMAIL_TAKEN);
    }

    if (!("role" in userData)) {
      const roles = await filterRoles({ name: "user" });
      if (roles.length > 0) {
        userData.role = roles[0].name as IUser["role"];
      }
    }

    const user = await User.create(userData);
    console.log(`[UserDebug] User created successfully: ${user._id}`);
    return user;
  } catch (err) {
    console.error(`[UserDebug] Error creating user:`, err);
    throw err;
  }
};

const queryUsers = async (
  filter: FilterQuery<IUser>,
  options: QueryOptions,
): Promise<CustomPaginateResult<IUser>> => {
  return await User.paginate(filter, options);
};

const getUserByEmail = async (email: string): Promise<IUser | null> => {
  const user = await User.findOne({ email: email.toLowerCase() });
  console.log(`[UserDebug] getUserByEmail("${email}") -> found: ${!!user}`);
  return user;
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

  if (updateBody.email) {
    updateBody.email = updateBody.email.toLowerCase();

    if (
      await User.isEmailTaken(
        updateBody.email,
        new mongoose.Types.ObjectId(userId),
      )
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }
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
