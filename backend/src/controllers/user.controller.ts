import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { MongooseQueryParser } from "mongoose-query-parser";
import successResponse from "../helpers/responses/successResponse";
import { type IUser } from "../models/user.model";
import { emailService, userService } from "../services";
import catchAsync from "../utils/catchAsync";
import * as constants from "../utils/constants/constants";
import * as emailConstants from "../utils/constants/email.constants";
import * as userConstants from "../utils/constants/user.constants";
import { generatePassword } from "../utils/passwordGenerator";
import pick from "../utils/pick";
import createSearchFilter from "../utils/search_filter";

const DEFAULT_ROLE: IUser["role"] = "user";

const createUser = catchAsync(async (req: Request, res: Response) => {
  let { password } = req.body;
  if (!password) password = generatePassword();

  // If created by a company admin, link to their company
  if (req.user?.role === 'admin' && req.user.companyId) {
    req.body.companyId = req.user.companyId;
  }

  const payload = { ...req.body, role: req.body.role || DEFAULT_ROLE };
  const user = await userService.createUser(payload);

  if (user) {
    await emailService.sendMail(emailConstants.USER_WITH_CREDENTIALS_TEMPLATE, {
      ...req.body,
      ...user,
      password,
    });
    successResponse(res, userConstants.USER_CREATED, httpStatus.CREATED, user);
  }
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const parsedQuery = new MongooseQueryParser().parse(req.query);
  let filter = pick(parsedQuery.filter, [
    "first_name",
    "last_name",
    "role",
    "search",
    "companyId"
  ]);

  if (filter?.search != null) {
    const searchTerm = (filter.search as string).trim();
    if (searchTerm) {
      const searchTerms = searchTerm.split(/\s+/);

      // ALL terms must match SOMEWHERE in the record
      const matchConditions = searchTerms.map(term => ({
        $or: [
          { first_name: { $regex: term, $options: 'i' } },
          { last_name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } }
        ]
      }));

      // Use a fresh object to avoid conflicts with existing keys in filter
      if (matchConditions.length > 0) {
        filter = {
          ...filter,
          $and: matchConditions
        };
      }
    }
    delete filter.search;
  }

  // Pre-process role filter to be more robust
  if (filter.role) {
    if (Array.isArray(filter.role) && filter.role.length === 0) {
      delete filter.role;
    } else if (typeof filter.role === 'string' && (filter.role === "" || filter.role === "[]")) {
      delete filter.role;
    } else if (typeof filter.role === 'object' && Object.keys(filter.role).length === 0) {
      delete filter.role;
    }
  }

  // Multi-tenancy isolation: By default, show all users (Global Directory).
  // If companyId is provided in query, it will be used.
  // We only force companyId if we want to RESTRICT, but user wants GLOBAL by default.

  // Normal users cannot filter by role
  if (!req.user?.role || !["super_admin", "admin"].includes(req.user.role)) {
    delete filter.role;
  }

  const options = pick(parsedQuery, [
    "skip",
    "limit",
    "select",
    "sort",
    "populate",
  ]);
  const result = await userService.queryUsers(filter, options);

  // role is already a string
  successResponse(res, constants.RETRIEVED, httpStatus.OK, result);
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.fetchAndValidateUser(req);
  successResponse(res, constants.RETRIEVED, httpStatus.OK, user);
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  await userService.fetchAndValidateUser(req);

  // Only Super Admin can update roles
  if (!req.user?.role || req.user.role !== "super_admin") {
    delete req.body.role;
  }

  const user = await userService.updateUserById(req.params.userId, req.body);
  if (user) {
    successResponse(res, userConstants.USER_UPDATED, httpStatus.OK, user);
  }
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await userService.fetchAndValidateUser(req);

  // Only Super Admin/Admin can delete users
  if (!req.user?.role || !["super_admin", "admin"].includes(req.user.role)) {
    throw new Error("Forbidden: Only Super Admin/Admin can delete users");
  }

  await userService.deleteUserById(req.params.userId);
  successResponse(res, userConstants.USER_DELETED, httpStatus.NO_CONTENT, {});
});

export { createUser, deleteUser, getUser, getUsers, updateUser };
