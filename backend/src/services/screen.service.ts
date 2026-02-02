import httpStatus from "http-status";
import { Screen, Template } from "../models";
import ApiError from "../utils/ApiError";
import { type CustomPaginateOptions } from "../models/plugins/paginate.plugin";
import { type IUser } from "../models/user.model";

/**
 * Create a screen
 * @param {Object} screenBody
 * @param {IUser} user
 * @returns {Promise<Screen>}
 */
const createScreen = async (screenBody: any, user: IUser) => {
  if (!user.companyId && user.role !== "super_admin") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must belong to a company to create screens");
  }

  // Check if template exists and is accessible
  const template = await Template.findById(screenBody.templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
  }

  if (user.role !== "super_admin" && !template.isPublic && template.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "Specified template is not accessible");
  }

  const payload = {
    ...screenBody,
    companyId: user.companyId,
    createdBy: user._id,
  };

  return await Screen.create(payload);
};

/**
 * Query for screens
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {IUser} user
 * @returns {Promise<QueryResult>}
 */
const queryScreens = async (filter: any, options: CustomPaginateOptions, user: IUser) => {
  const tenantFilter = user.role === "super_admin"
    ? {}
    : {
      $or: [
        { companyId: user.companyId },
        { isPublic: true }
      ]
    };

  const finalFilter = { deletedAt: null, ...filter, ...tenantFilter };

  const screens = await Screen.paginate(finalFilter, {
    ...options,
    populate: "templateId",
  });
  return screens;
};

/**
 * Get screen by id
 * @param {ObjectId} id
 * @returns {Promise<Screen>}
 */
const getScreenById = async (id: string, user?: IUser) => {
  const screen = await Screen.findById(id).populate("templateId");

  if (screen && user && user.role !== "super_admin") {
    if (!screen.isPublic && screen.companyId?.toString() !== user.companyId?.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
    }
  }

  return screen;
};

/**
 * Update screen by id
 * @param {ObjectId} screenId
 * @param {Object} updateBody
 * @param {IUser} user
 * @returns {Promise<Screen>}
 */
const updateScreenById = async (screenId: string, updateBody: any, user: IUser) => {
  const screen = await Screen.findById(screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Screen not found");
  }

  // Permission check
  if (user.role !== "super_admin" && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to update this screen");
  }

  if (updateBody.templateId) {
    const template = await Template.findById(updateBody.templateId);
    if (!template) {
      throw new ApiError(httpStatus.NOT_FOUND, "Template not found");
    }
    // Check if new template is accessible
    if (user.role !== "super_admin" && !template.isPublic && template.companyId?.toString() !== user.companyId?.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, "Specified template is not accessible");
    }
  }

  Object.assign(screen, updateBody);
  await screen.save();
  return screen;
};

/**
 * Delete screen by id
 * @param {ObjectId} screenId
 * @param {IUser} user
 * @returns {Promise<Screen>}
 */
const deleteScreenById = async (screenId: string, user: IUser) => {
  const screen = await Screen.findById(screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Screen not found");
  }

  // Permission check
  if (user.role !== "super_admin" && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to delete this screen");
  }

  screen.deletedAt = new Date();
  await screen.save();
  return screen;
};

/**
 * Restore screen by id
 * @param {ObjectId} screenId
 * @param {IUser} user
 * @returns {Promise<Screen>}
 */
const restoreScreenById = async (screenId: string, user: IUser) => {
  const screen = await Screen.findById(screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Screen not found");
  }

  // Permission check
  if (user.role !== "super_admin" && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to restore this screen");
  }

  screen.deletedAt = null;
  await screen.save();
  return screen;
};

/**
 * Permanently delete screen by id
 * @param {ObjectId} screenId
 * @param {IUser} user
 * @returns {Promise<Screen>}
 */
const permanentDeleteScreenById = async (screenId: string, user: IUser) => {
  const screen = await Screen.findById(screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Screen not found");
  }

  // Permission check
  if (user.role !== "super_admin" && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to permanently delete this screen");
  }

  await screen.deleteOne();
  return screen;
};

/**
 * Get screens by template id
 * @param {ObjectId} templateId
 * @returns {Promise<Screen[]>}
 */
const getScreensByTemplateId = async (templateId: string) => {
  return await Screen.find({ templateId });
};

export default {
  createScreen,
  queryScreens,
  getScreenById,
  updateScreenById,
  deleteScreenById,
  restoreScreenById,
  permanentDeleteScreenById,
  getScreensByTemplateId,
};
