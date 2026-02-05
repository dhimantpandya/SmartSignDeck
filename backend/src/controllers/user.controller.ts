import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { MongooseQueryParser } from "mongoose-query-parser";
import successResponse from "../helpers/responses/successResponse";
import { type IUser } from "../models/user.model";
import { Company } from "../models";
import { emailService, userService } from "../services";
import catchAsync from "../utils/catchAsync";
import * as constants from "../utils/constants/constants";
import * as emailConstants from "../utils/constants/email.constants";
import * as userConstants from "../utils/constants/user.constants";
import { generatePassword } from "../utils/passwordGenerator";
import pick from "../utils/pick";
import createSearchFilter from "../utils/search_filter";
import ApiError from "../utils/ApiError";

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

  // Multi-tenancy isolation logic refinement
  if (filter.companyId) {
    const companyId = filter.companyId;
    // Look up company details
    const company = await Company.findById(companyId);
    if (company) {
      // Find all companies with the same name to catch duplicates or legacy links
      const relatedCompanies = await Company.find({
        name: { $regex: new RegExp(`^${company.name}$`, "i") }
      });
      const companyIds = relatedCompanies.map(c => c._id);
      const companyNames = relatedCompanies.map(c => c.name);

      filter.$or = [
        { companyId: { $in: companyIds } },
        { companyName: { $in: companyNames } },
        { companyName: { $regex: new RegExp(`^${company.name}$`, "i") } }
      ];
    } else {
      // Fallback: If company doc not found, still filter by the ID provided
      filter.$or = [
        { companyId: companyId },
        { companyName: companyId }
      ];
    }
    delete filter.companyId;
  }

  const options = pick(parsedQuery, [
    "skip",
    "limit",
    "select",
    "sort",
    "populate",
  ]);

  // Always populate companyId to get company name
  options.populate = 'companyId';

  console.log('[DEBUG] getUsers - filter:', JSON.stringify(filter));
  console.log('[DEBUG] getUsers - options:', JSON.stringify(options));

  const result = await userService.queryUsers(filter, options);

  console.log('[DEBUG] getUsers - raw result:', {
    resultsCount: result.results?.length,
    totalResults: result.totalResults,
    hasResults: !!result.results
  });

  // Map results to include companyName from populated companyId
  if (result.results) {
    try {
      result.results = result.results.map((user: any, index: number) => {
        try {
          // Use toJSON to get the proper serialized object
          const userObj = user.toJSON ? user.toJSON() : user;

          console.log(`[DEBUG] User ${index} - id:`, userObj.id, 'companyId:', userObj.companyId);

          // Extract company name if companyId is populated
          const companyName = userObj.companyId?.name || null;
          const companyId = userObj.companyId?.id || userObj.companyId || null;

          return {
            ...userObj,
            companyName,
            companyId,
          };
        } catch (userError) {
          console.error(`[ERROR] Failed to transform user at index ${index}:`, userError);
          console.error('[ERROR] User data:', user);
          throw userError;
        }
      });

      console.log('[DEBUG] getUsers - transformed results count:', result.results.length);
    } catch (mapError) {
      console.error('[ERROR] Failed to map users:', mapError);
      throw mapError;
    }
  }

  // role is already a string
  successResponse(res, constants.RETRIEVED, httpStatus.OK, result);
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  let user = await userService.fetchAndValidateUser(req);

  // Populate companyId to get company name
  user = await user.populate('companyId');

  // Use toJSON to get the proper serialized object
  const userObj = user.toJSON ? user.toJSON() : user;

  // Extract company name if companyId is populated
  const companyName = (userObj as any).companyId?.name || null;
  const companyId = (userObj as any).companyId?.id || (userObj as any).companyId || null;

  const result = {
    ...userObj,
    companyName,
    companyId,
  };

  successResponse(res, constants.RETRIEVED, httpStatus.OK, result);
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  console.log('[DEBUG] updateUser called for userId:', req.params.userId);
  const targetUser = await userService.fetchAndValidateUser(req);
  const currentUser = req.user as any;

  // RBAC Refinement: Admin cannot edit users from other companies
  if (currentUser.role === 'admin') {
    if (targetUser.companyId?.toString() !== currentUser.companyId?.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: You can only edit users within your own company.");
    }
  }

  // Only Super Admin can update roles
  if (currentUser.role !== "super_admin") {
    console.log('[DEBUG] User is not super_admin, removing role from update');
    delete req.body.role;
  }

  const updateBody = { ...req.body };
  if (updateBody.companyName || updateBody.companyId) {
    updateBody.onboardingCompleted = true;
  }

  const user = await userService.updateUserById(req.params.userId, updateBody);
  console.log('[DEBUG] User updated successfully:', user.email);

  if (user) {
    // Populate companyId to get company name
    await user.populate('companyId');

    // Use toJSON to get the proper serialized object
    const userObj = user.toJSON ? user.toJSON() : user;

    // Extract company name if companyId is populated
    const companyName = (userObj as any).companyId?.name || null;
    const companyId = (userObj as any).companyId?.id || (userObj as any).companyId || null;

    const result = {
      ...userObj,
      companyName,
      companyId,
    };

    successResponse(res, userConstants.USER_UPDATED, httpStatus.OK, result);
  }
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const targetUser = await userService.fetchAndValidateUser(req);
  const currentUser = req.user as any;

  // RBAC Refinement: Only Super Admin/Admin can delete users
  if (!currentUser?.role || !["super_admin", "admin"].includes(currentUser.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Only Super Admin/Admin can delete users");
  }

  // RBAC Refinement: Admin cannot delete users from other companies
  if (currentUser.role === 'admin') {
    if (targetUser.companyId?.toString() !== currentUser.companyId?.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: You can only delete users within your own company.");
    }
  }

  await userService.deleteUserById(req.params.userId);
  successResponse(res, userConstants.USER_DELETED, httpStatus.NO_CONTENT, {});
});

export { createUser, deleteUser, getUser, getUsers, updateUser };
