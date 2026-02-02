import httpStatus from "http-status";
import { Template } from "../models";
import ApiError from "../utils/ApiError";
import { type CustomPaginateOptions } from "../models/plugins/paginate.plugin";
import { type IUser } from "../models/user.model";

/**
 * Create a template
 * @param {Object} templateBody
 * @param {IUser} user
 * @returns {Promise<Template>}
 */
const createTemplate = async (templateBody: any, user: IUser) => {
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
  // Enforce company boundaries
  const tenantFilter = user.role === "super_admin"
    ? {}
    : {
      $or: [
        { companyId: user.companyId },
        { isPublic: true }
      ]
    };

  const finalFilter = { deletedAt: null, ...filter, ...tenantFilter };
  const templates = await Template.paginate(finalFilter, options);
  return templates;
};

/**
 * Get template by id
 * @param {ObjectId} id
 * @returns {Promise<Template>}
 */
const getTemplateById = async (id: string) => {
  return await Template.findById(id);
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
  const { Screen } = await import("../models");
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

export default {
  createTemplate,
  queryTemplates,
  getTemplateById,
  updateTemplateById,
  deleteTemplateById,
  restoreTemplateById,
  permanentDeleteTemplateById,
};
