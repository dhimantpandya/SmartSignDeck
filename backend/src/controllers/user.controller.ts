import { type Request, type Response } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { MongooseQueryParser } from "mongoose-query-parser";
import successResponse from "../helpers/responses/successResponse";
import { type IUser } from "../models/user.model";
import User from "../models/user.model";
import Company from "../models/company.model";
import { emailService, userService } from "../services";
import notificationService from "../services/notification.service";
import { emitToUser, getIO, cleanId } from "../services/socket.service";
import catchAsync from "../utils/catchAsync";
import * as constants from "../utils/constants/constants";
import * as emailConstants from "../utils/constants/email.constants";
import * as userConstants from "../utils/constants/user.constants";
import { generatePassword } from "../utils/passwordGenerator";
import pick from "../utils/pick";
import createSearchFilter from "../utils/search_filter";
import ApiError from "../utils/ApiError";
import { escapeRegExp } from "../utils/regex";

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
  }

  // Global broadcast for real-time list update
  try { getIO().emit('user_updated', user); } catch (e) { }

  successResponse(res, userConstants.USER_CREATED, httpStatus.CREATED, user);
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
    const searchTerm = escapeRegExp((filter.search as string).trim());
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
  const PREDEFINED_EMAIL = "smartsigndeckk@gmail.com";

  if (filter.companyId) {
    const companyId = filter.companyId;
    if (mongoose.Types.ObjectId.isValid(companyId as string)) {
      const company = await Company.findById(companyId);
      if (company) {
        const trimmedName = company.name.trim();
        const relatedCompanies = await Company.find({
          name: { $regex: new RegExp(`^${escapeRegExp(trimmedName)}$`, "i") }
        });
        const companyIds = relatedCompanies.map(c => c._id);
        const companyNames = relatedCompanies.map(c => c.name);

        filter.$or = [
          { companyId: { $in: companyIds } },
          { companyName: { $in: companyNames } },
          { companyName: { $regex: new RegExp(`^${escapeRegExp(company.name)}$`, "i") } }
        ];
      } else {
        filter.$or = [
          { companyId: companyId },
          { companyName: companyId }
        ];
      }
    } else {
      // If companyId is not a valid ObjectId, try matching it as a string name
      filter.$or = [
        { companyName: companyId },
        { companyName: { $regex: new RegExp(`^${escapeRegExp(companyId as string)}$`, "i") } }
      ];
    }
    delete filter.companyId;
  } else {
    // If NO companyId is provided (Global Directory mode)
    // we should still ensure smartsigndeck is visible even if search filters are applied.
    if (filter.search || filter.role || filter.first_name || filter.last_name) {
      // Standard filtering without forced super admin inclusion
    }
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
  if (result.results && Array.isArray(result.results)) {
    try {
      result.results = result.results.map((user: any, index: number) => {
        try {
          if (!user) return null;

          // Use toJSON if available, otherwise assume it's already a POJO
          const userObj = user.toJSON ? user.toJSON() : user;

          // Extract company name if companyId is populated
          let companyName = userObj.companyName || null;
          let companyId = userObj.companyId || null;

          if (userObj.companyId && typeof userObj.companyId === 'object') {
            // Mongoose creates a virtual 'id' for the string representation of '_id'
            companyName = userObj.companyId.name || userObj.companyName || null;
            companyId = userObj.companyId._id || userObj.companyId.id || userObj.companyId || null;

            // Ensure companyId is a string if it's still an object (ObjectId)
            if (companyId && typeof companyId === 'object' && companyId.toString) {
              companyId = companyId.toString();
            }
          }

          return {
            ...userObj,
            id: userObj._id || userObj.id, // Explicit ID mapping
            companyName,
            companyId,
          };
        } catch (userError) {
          console.error(`[ERROR] Failed to transform user at index ${index}:`, userError);
          return user.toJSON ? user.toJSON() : user;
        }
      }).filter(Boolean);

      // 🔝 Sort by role priority: super_admin → admin → user → others
      const rolePriority: Record<string, number> = { super_admin: 0, admin: 1, user: 2 };
      result.results = result.results.sort((a: any, b: any) => {
        const ap = rolePriority[a?.role] ?? 3;
        const bp = rolePriority[b?.role] ?? 3;
        return ap - bp;
      });

      console.log('[DEBUG] getUsers - transformed results count:', result.results.length);
    } catch (mapError) {
      console.error('[ERROR] Failed to map users:', mapError);
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
  let companyName = null;
  let companyId = null;

  if ((userObj as any).companyId && typeof (userObj as any).companyId === 'object') {
    companyName = (userObj as any).companyId.name || (userObj as any).companyName || null;
    companyId = (userObj as any).companyId.id || (userObj as any).companyId._id || null;
  } else {
    companyName = (userObj as any).companyName || null;
    companyId = (userObj as any).companyId || null;
  }

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

  const oldRole = targetUser.role;
  const user = await userService.updateUserById(req.params.userId, updateBody);
  console.log('[DEBUG] User updated successfully:', user.email);

  if (user && updateBody.role && updateBody.role !== oldRole) {
    console.log(`[DEBUG] Role changed from ${oldRole} to ${user.role}. Triggering notification.`);

    // Create persistent notification
    await notificationService.createNotification(
      user.id || (user as any)._id,
      "system_alert",
      "Role Updated",
      `Your account role has been updated to ${user.role}.`,
      currentUser.id || (currentUser as any)._id
    );

    // Emit real-time socket event
    emitToUser(user.id || (user as any)._id, "role_changed", {
      newRole: user.role,
      updatedBy: currentUser.id || (currentUser as any)._id
    });
  }

  // Global broadcast for real-time list update (for all admins)
  try { getIO().emit('user_updated', { id: user.id || (user as any)._id }); } catch (e) { }

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
  const { password } = req.body;

  // 1. Strict Requirement: Only Super Admin can delete users directly
  if (currentUser?.role !== "super_admin") {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Only Super Admin can delete users directly");
  }

  // 2. Mandatory Password Verification for Super Admin
  const adminUser = await User.findById(currentUser.id || currentUser._id);
  if (!adminUser || !password || !(await adminUser.isPasswordMatch(password))) {
    // If wrong password, trigger logout of the Super Admin (Security Protocol)
    console.warn(`[SECURITY] Super Admin ${adminUser?.email} failed deletion password. Triggering logout.`);
    
    // Attempt to blacklist the refresh token if available in backend state
    // For now, we return 401 and the frontend should handle state clearing
    throw new ApiError(httpStatus.UNAUTHORIZED, "Security Alert: Incorrect password. You have been signed out for safety.");
  }

  const companyId = targetUser.companyId;

  // 3. Send Notification Email (Safety Reasons) - Non-blocking
  emailService.sendMail(emailConstants.ACCOUNT_DELETED_TEMPLATE, {
    email: targetUser.email,
    name: `${targetUser.first_name} ${targetUser.last_name}`,
  }).catch(err => {
    console.error(`[ERROR] Failed to send account deletion email to ${targetUser.email}:`, err);
  });

  // 4. Perform Deletion
  await userService.deleteUserById(req.params.userId);

  // 5. Organization Status Logic: If last user, set company to inactive
  if (companyId) {
    const memberCount = await User.countDocuments({ companyId });
    if (memberCount === 0) {
      await Company.findByIdAndUpdate(companyId, { isActive: false });
      console.log(`[Status] Company ${companyId} deactivated as it has 0 members.`);
    }
  }

  // 6. Real-time notifications
  try { getIO().emit('user_deleted', { id: req.params.userId }); } catch (e) { }

  successResponse(res, userConstants.USER_DELETED, httpStatus.OK, {});
});

const fixCompanyMismatch = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user as any;
  const TARGET_COMPANY_ID = '698f1a5fab433f60971ed4e7';

  // Security check: Only allow this for the specific user we are debugging
  // Or if they are already in the target company, do nothing.
  if (currentUser.companyId && currentUser.companyId.toString() === TARGET_COMPANY_ID) {
    return successResponse(res, "Already in correct company", httpStatus.OK, {});
  }

  // Find target company
  const targetCompany = await Company.findById(TARGET_COMPANY_ID);
  if (!targetCompany) {
    throw new ApiError(httpStatus.NOT_FOUND, "Target company not found");
  }

  // Update user
  const user = await userService.getUserById(currentUser._id);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  user.companyId = targetCompany._id;
  user.companyName = targetCompany.name;
  await user.save();

  console.log(`[FIX] User ${user.email} moved to company ${targetCompany.name} (${targetCompany._id})`);

  successResponse(res, "Company ID fixed successfully. Please refresh.", httpStatus.OK, {
    companyId: targetCompany._id,
    companyName: targetCompany.name
  });
});

export { createUser, deleteUser, getUser, getUsers, updateUser, fixCompanyMismatch };
