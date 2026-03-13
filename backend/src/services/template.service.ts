import mongoose from "mongoose";
import httpStatus from "http-status";
import logger from "../config/logger";
import { Template, Company, User, TemplateGroup } from "../models";
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

  const companyName = user.companyName || `${user.first_name}'s Workspace`;
  const normalizedName = companyName.trim().toLowerCase();

  let company = await Company.findOne({ name: normalizedName });

  if (!company) {
    company = await Company.create({
      name: normalizedName,
      ownerId: user._id || (user as any).id,
    });
  }

  await User.findByIdAndUpdate(user._id || (user as any).id, {
    companyId: company._id,
    companyName: company.name,
    role: "admin",
    onboardingCompleted: true,
  });

  user.companyId = company._id as any;
  (user as any).companyName = company.name;
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
    lastModifiedBy: user._id,
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
  const finalFilter: any = { ...filter };

  // Handle soft-delete filtering
  if (finalFilter.trashed === true) {
    finalFilter.deletedAt = { $ne: null };
  } else if (finalFilter.trashed === false || finalFilter.deletedAt === undefined) {
    finalFilter.deletedAt = null;
  }
  delete finalFilter.trashed;

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
    const userId = mongoose.Types.ObjectId.isValid(userIdStr) ? new mongoose.Types.ObjectId(userIdStr) : null;

    const requestedCreatedBy = (filter.createdBy || "").toString();
    const requestedCollaborators = (filter.collaborators || "").toString();

    const isQueryingOwn = requestedCreatedBy && userIdStr && requestedCreatedBy === userIdStr;
    const isQueryingShared = requestedCollaborators && userIdStr && requestedCollaborators === userIdStr;
    const isRecycleBinQuery = finalFilter.deletedAt !== null;
    const isQueryingPublic = finalFilter.isPublic === true;
    const isQueryingByCreator = !!finalFilter.createdBy;

    if (isRecycleBinQuery) {
      // 🗑️ Recycle Bin Isolation: Strictly same user ONLY
      if (userId) {
        finalFilter.createdBy = userId;
      }
    } else if (isQueryingPublic) {
      // 🌍 Global View: If specifically querying public items, just ensure we stick to isPublic: true
      finalFilter.isPublic = true;
    } else if (isQueryingShared && userId) {
      // 🤝 Explicit Shared Query: Just stick to the collaborators filter
      finalFilter.collaborators = userId;
      // 🔒 Strict Isolation: Always restrict to current user
      const securityConditions: any[] = [];

      if (userId) {
        securityConditions.push({ createdBy: userId });
      }

      // 🤝 Add Shared access
      if (userId) {
        securityConditions.push({ collaborators: userId });
      }

      // 🌍 ALWAYS Add Public access
      securityConditions.push({ isPublic: true });

      finalFilter.$or = securityConditions;

      // 👤 Strict User Isolation: Honor the 'createdBy' filter if provided by the frontend.
      if (isQueryingOwn && userId) {
        delete finalFilter.$or;
        finalFilter.createdBy = userId;
      }
    }
  }

  console.log(`[TEMPLATE_QUERY] Final Filter for user ${user._id || (user as any).id}:`, JSON.stringify(finalFilter, null, 2));

  const templates = await Template.paginate(finalFilter, {
    ...options,
    populate: [
      { path: "createdBy", select: "id _id first_name last_name email avatar" },
      { path: "lastModifiedBy", select: "id _id first_name last_name email avatar" }
    ]
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
  const template = await Template.findById(id)
    .populate({
      path: "collaborators",
      select: "id _id first_name last_name email avatar"
    })
    .populate({
      path: "lastModifiedBy",
      select: "id _id first_name last_name email avatar"
    });
  if (!template) return null;

  // If user is provided, check read permissions
  if (user && user.role !== "super_admin") {
    const isOwner = template.companyId?.toString() === user.companyId?.toString();
    const isPublic = template.isPublic;
    const isCollaborator = (template.collaborators as any[])?.some(c => (c._id || c).toString() === (user._id || (user as any).id).toString());

    if (!isOwner && !isPublic && !isCollaborator) {
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
  const isCreator = template.createdBy?.toString() === (user._id || (user as any).id).toString();
  const isCollaborator = (template.collaborators as any[])?.some(c => (c._id || c).toString() === (user._id || (user as any).id).toString());

  if (user.role !== "super_admin" && !isCreator && !isCollaborator) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to update this template. Only the creator and invited collaborators can edit.");
  }

  // Inject lastModifiedBy
  updateBody.lastModifiedBy = user._id || (user as any).id;

  Object.assign(template, updateBody);
  await template.save();
  return template;
};

/**
 * Delete multiple templates by ids
 * @param {string[]} ids
 * @param {IUser} user
 * @returns {Promise<number>} - number of templates deleted
 */
const deleteTemplatesByIds = async (ids: string[], user: IUser) => {
  const { default: Screen } = await import("../models/screen.model");

  // Filter templates that are NOT used by any screens
  const validIdsToDelete: string[] = [];
  const errors: string[] = [];

  for (const templateId of ids) {
    const template = await getTemplateById(templateId);
    if (!template) continue;

    // Permission Check
    if (user.role !== "super_admin" && template.companyId?.toString() !== user.companyId?.toString()) {
      errors.push(`Template ${template.name}: Permission denied`);
      continue;
    }

    // Check for dependent screens (EXCLUDING trashed ones)
    const screensUsingTemplate = await Screen.find({ templateId, deletedAt: null });
    if (screensUsingTemplate.length > 0) {
      errors.push(`Template ${template.name}: Used by ${screensUsingTemplate.length} active screen(s)`);
      continue;
    }

    validIdsToDelete.push(templateId);
  }

  if (validIdsToDelete.length === 0 && errors.length > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot delete selected templates: ${errors.join(", ")}`);
  }

  const result = await Template.updateMany(
    { _id: { $in: validIdsToDelete } },
    { $set: { deletedAt: new Date() } }
  );

  return {
    deletedCount: result.modifiedCount,
    errors: errors.length > 0 ? errors : undefined
  };
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
  const screensUsingTemplate = await Screen.find({ templateId, deletedAt: null });

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
  // Use Template.findById directly for cloning to avoid the restricted 'view' check in getTemplateById
  // We trust the caller (like cloneScreen) has already validated access to the original source.
  const originalTemplate = await Template.findById(templateId);
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

/**
 * Bootstrap templates from an inspiration item
 * @param {string} name - Inspiration item name
 * @param {IUser} user
 * @returns {Promise<ITemplateGroup>}
 */
const bootstrapFromInspiration = async (name: string, user: IUser) => {
  await ensureUserCompany(user);

  // 1. Create the Group
  const group = await TemplateGroup.create({
    name: name,
    companyId: user.companyId,
    createdBy: user._id,
  });

  // 2. Create 3 templates with 4 zones each in the specific grid requested:
  // TL(NW) Mixed, TR(NE) Photo, BL(SW) Text, BR(SE) Video
  const templates = [];
  const resolutions = ["1920x1080", "1920x1080", "1920x1080"];

  for (let i = 0; i < 3; i++) {
    const zones = [
      {
        id: 'zone-nw',
        name: 'NW (Top-Left)',
        type: 'mixed',
        x: 0,
        y: 0,
        width: 960,
        height: 540,
        mediaType: 'both',
      },
      {
        id: 'zone-ne',
        name: 'NE (Top-Right)',
        type: 'image',
        x: 960,
        y: 0,
        width: 960,
        height: 540,
        mediaType: 'image',
      },
      {
        id: 'zone-sw',
        name: 'SW (Bottom-Left)',
        type: 'text',
        x: 0,
        y: 540,
        width: 960,
        height: 540,
        mediaType: 'both',
      },
      {
        id: 'zone-se',
        name: 'SE (Bottom-Right)',
        type: 'video',
        x: 960,
        y: 540,
        width: 960,
        height: 540,
        mediaType: 'video',
      }
    ];

    const template = await Template.create({
      name: `${name} - Variant ${i + 1}`,
      resolution: resolutions[i],
      zones,
      companyId: user.companyId,
      createdBy: user._id,
      isPublic: false,
    });
    templates.push(template._id);
  }

  // 3. Link templates to group
  group.templates = templates;
  await group.save();

  return group;
};

export default {
  ensureUserCompany,
  createTemplate,
  queryTemplates,
  getTemplateById,
  updateTemplateById,
  deleteTemplateById,
  deleteTemplatesByIds,
  restoreTemplateById,
  permanentDeleteTemplateById,
  cloneTemplate,
  bootstrapFromInspiration,
};
