import mongoose from "mongoose";
import httpStatus from "http-status";
import logger from "../config/logger";
import mongoose from "mongoose";
import httpStatus from "http-status";
import logger from "../config/logger";
import Template from "../models/template.model";
import Company from "../models/company.model";
import User from "../models/user.model";
import ApiError from "../utils/ApiError";
import { type CustomPaginateOptions } from "../models/plugins/paginate.plugin";
import { type IUser } from "../models/user.model";

/**
 * Create a template
 * @param {Object} templateBody
 * @param {IUser} user
 * @returns {Promise<Template>}
 */

const ensureUserCompany = async (user: IUser) => {
  if (user.companyId || user.role === "super_admin") return;

  const newCompany = await Company.create({
    name: `${user.first_name}'s Workspace`,
    ownerId: user._id || (user as any).id,
  });

  await User.findByIdAndUpdate(user._id || (user as any).id, {
    companyId: newCompany._id,
    companyName: newCompany.name,
    role: "admin",
    onboardingCompleted: true,
  });

  user.companyId = newCompany._id as any;
  (user as any).companyName = newCompany.name;
};

const createTemplate = async (templateBody: any, user: IUser) => {
  await ensureUserCompany(user);

  if (!user.companyId && user.role !== "super_admin") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must belong to a company to create templates");
  }

  const payload = {
    ...templateBody,
    companyId: user.companyId,
    createdBy: user._id,
  };

  return await Template.create(payload);
};

/**
 * Query for templates
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {IUser} user
 * @returns {Promise<QueryResult>}
 */
const queryTemplates = async (filter: any, options: CustomPaginateOptions, user: IUser) => {
  // 1. Clean up filter and ensure proper types
  const finalFilter: any = { deletedAt: null, ...filter };

  // Remove empty/undefined/string-literal-undefined filters
  Object.keys(finalFilter).forEach(key => {
    if (finalFilter[key] === undefined || finalFilter[key] === null || finalFilter[key] === '' || finalFilter[key] === 'undefined' || finalFilter[key] === 'null') {
      if (key !== 'deletedAt') delete finalFilter[key];
    }
  });

  // 2. Apply security/tenant filtering
  if (user.role !== "super_admin") {
    // 🔒 Robust ID Check
    const userIdStr = (user._id || (user as any).id || "").toString();
    const companyIdStr = (user.companyId || "").toString();
    const requestedCreatedBy = (filter.createdBy || "").toString();

    const isQueryingOwn = requestedCreatedBy && userIdStr && requestedCreatedBy === userIdStr;
    const isRecycleBinQuery = finalFilter.deletedAt !== null;

    if (isRecycleBinQuery) {
      // 🗑️ Recycle Bin Isolation: Strictly same company ONLY
      if (companyIdStr && mongoose.Types.ObjectId.isValid(companyIdStr)) {
        finalFilter.companyId = new mongoose.Types.ObjectId(companyIdStr);
      } else {
        finalFilter.createdBy = new mongoose.Types.ObjectId(userIdStr);
      }
    } else {
      // 🔒 Account Isolation: Strictly same company ONLY (whether public or private)
      if (companyIdStr && mongoose.Types.ObjectId.isValid(companyIdStr)) {
        finalFilter.companyId = new mongoose.Types.ObjectId(companyIdStr);
      } else if (userIdStr && mongoose.Types.ObjectId.isValid(userIdStr)) {
        // Fallback to own content if no companyId
        finalFilter.createdBy = new mongoose.Types.ObjectId(userIdStr);
      }

      // 👤 Strict User Isolation: Honor the 'createdBy' filter if provided by the frontend.
      // This ensures the "My Templates" tab matches Dashboard counts.
      if (isQueryingOwn && userIdStr && mongoose.Types.ObjectId.isValid(userIdStr)) {
        finalFilter.createdBy = new mongoose.Types.ObjectId(userIdStr);
      }
    }
  }

  const templates = await Template.paginate(finalFilter, {
    ...options,
    populate: { path: "createdBy", select: "id _id first_name last_name email avatar" }
  });

  return templates;
};

/**
 * Get template by id (with permission check)
 * @param {ObjectId} id
 * @param {IUser} user
 * @returns {Promise<Template>}
 */
const getTemplateById = async (id: string, user?: IUser) => {
  const template = await Template.findById(id);
  if (!template) return null;

  // If user is provided, check read permissions
  if (user && user.role !== "super_admin") {
    const isOwner = template.companyId?.toString() === user.companyId?.toString();
    const isPublic = template.isPublic;

    if (!isOwner && !isPublic) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to view this template");
    }
  }

  return template;
};

/**
 * Update template by id
 * @param {ObjectId} templateId
 * @param {Object} updateBody
 * @param {IUser} user
 * @returns {Promise<Template>}
 */
const updateTemplateById = async (templateId: string, updateBody: any, user: IUser) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }

  // Permission Check
  if (user.role !== "super_admin" && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to update this template");
  }

  Object.assign(template, updateBody);
  await template.save();
  return template;
};

/**
 * Delete template by id
 * @param {ObjectId} templateId
 * @param {IUser} user
 * @returns {Promise<Template>}
 */
const deleteTemplateById = async (templateId: string, user: IUser) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }

  // Permission Check
  if (user.role !== "super_admin" && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to delete this template");
  }

  // Check for dependent screens
  const { default: Screen } = await import("../models/screen.model");
  const screensUsingTemplate = await Screen.find({ templateId });

  if (screensUsingTemplate.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete template. ${screensUsingTemplate.length} screen(s) are using it. Please reassign or delete those screens first.`
    );
  }

  template.deletedAt = new Date();
  await template.save();
  return template;
};

/**
 * Restore template by id
 * @param {ObjectId} templateId
 * @param {IUser} user
 * @returns {Promise<Template>}
 */
const restoreTemplateById = async (templateId: string, user: IUser) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }

  // Permission Check
  if (user.role !== "super_admin" && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to restore this template");
  }

  template.deletedAt = null;
  await template.save();
  return template;
};

/**
 * Permanently delete template by id
 * @param {ObjectId} templateId
 * @param {IUser} user
 * @returns {Promise<Template>}
 */
const permanentDeleteTemplateById = async (templateId: string, user: IUser) => {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }

  // Permission Check
  if (user.role !== "super_admin" && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to permanently delete this template");
  }

  await template.deleteOne();
  return template;
};

/**
 * Clone a template for the current user
 * @param {ObjectId} templateId
 * @param {IUser} user
 * @returns {Promise<Template>}
 */
const cloneTemplate = async (templateId: string, user: IUser) => {
  const originalTemplate = await getTemplateById(templateId, user);
  if (!originalTemplate) {
    throw new ApiError(httpStatus.NOT_FOUND, "Original template not found");
  }

  await ensureUserCompany(user);

  if (!user.companyId && user.role !== "super_admin") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must belong to a company to clone templates");
  }

  const payload = {
    name: `Copy of ${originalTemplate.name}`,
    resolution: originalTemplate.resolution,
    zones: originalTemplate.zones.map(z => ({
      id: z.id,
      type: z.type,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      name: z.name,
      media: z.media,
      mediaType: z.mediaType,
      lockedMediaType: z.lockedMediaType,
    })),
    companyId: user.companyId,
    createdBy: user._id,
    isPublic: false,
  };

  try {
    return await Template.create(payload);
  } catch (error: any) {
    logger.error(`[CLONE] Template.create failed: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to clone template: ${error.message}`);
  }
};

export default {
  createTemplate,
  queryTemplates,
  getTemplateById,
  updateTemplateById,
  deleteTemplateById,
  restoreTemplateById,
  permanentDeleteTemplateById,
  cloneTemplate,
};
