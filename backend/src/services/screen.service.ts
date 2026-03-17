import httpStatus from 'http-status';
import Screen from '../models/screen.model';
import ApiError from '../utils/ApiError';
import mongoose from 'mongoose';

/**
 * Create a screen
 */
const createScreen = async (screenBody: any, user: any) => {
  const finalBody = {
    ...screenBody,
    createdBy: user._id || user.id,
    companyId: user.companyId
  };
  return Screen.create(finalBody);
};

/**
 * Query for screens
 */
const queryScreens = async (filter: any, options: any, user?: any) => {
  const finalFilter = { ...filter };
  if (user && !user.roles?.includes('super_admin')) {
    finalFilter.companyId = user.companyId;
  }
  const screens = await (Screen as any).paginate(finalFilter, options);
  return screens;
};

/**
 * Get screen by id
 */
const getScreenById = async (id: string, user?: any, secretKey?: string) => {
  const filter: any = { _id: id };
  if (secretKey) {
    filter.secretKey = secretKey;
  }
  const screen = await Screen.findOne(filter).populate('templateId');
  
  if (screen && user && !user.roles?.includes('super_admin') && screen.companyId?.toString() !== user.companyId?.toString()) {
     // If not public and not same company, return null or throw?
     // For now, if we have a secretKey, we allow it (player mode)
     if (!secretKey && screen.visibility !== 'public') return null;
  }
  
  return screen;
};

/**
 * Update screen by id
 */
const updateScreenById = async (screenId: string, updateBody: any, user?: any) => {
  const screen = await Screen.findById(screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Screen not found');
  }
  
  if (user && !user.roles?.includes('super_admin') && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  Object.assign(screen, updateBody);
  await screen.save();
  return screen;
};

/**
 * Delete screen by id
 */
const deleteScreenById = async (screenId: string, user?: any) => {
  const screen = await Screen.findById(screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Screen not found');
  }

  if (user && !user.roles?.includes('super_admin') && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  screen.deletedAt = new Date();
  await screen.save();
  return screen;
};

/**
 * Restore screen by id
 */
const restoreScreenById = async (screenId: string, user?: any) => {
  const screen = await Screen.findOne({ _id: screenId });
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Screen not found');
  }

  if (user && !user.roles?.includes('super_admin') && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  screen.deletedAt = undefined as any;
  await screen.save();
  return screen;
};

/**
 * Permanent delete screen by id
 */
const permanentDeleteScreenById = async (screenId: string, user?: any) => {
  const screen = await Screen.findOne({ _id: screenId });
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Screen not found');
  }

  if (user && !user.roles?.includes('super_admin') && screen.companyId?.toString() !== user.companyId?.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  await screen.deleteOne();
  return screen;
};

/**
 * Delete screens by ids (bulk)
 */
const deleteScreensByIds = async (ids: string[], user: any) => {
  const filter: any = { _id: { $in: ids } };
  if (!user.roles?.includes('super_admin')) {
    filter.companyId = user.companyId;
  }
  return Screen.updateMany(filter, { deletedAt: new Date() });
};

/**
 * Get screens by template id
 */
const getScreensByTemplateId = async (templateId: string) => {
    return Screen.find({ templateId });
};

/**
 * Clone a screen
 */
const cloneScreen = async (screenId: string, user: any) => {
  const screen = await Screen.findById(screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Screen not found');
  }

  const clonedScreen = await Screen.create({
    name: `${screen.name} (Copy)`,
    location: (screen as any).location,
    templateId: (screen as any).templateId,
    defaultContent: (screen as any).defaultContent,
    schedules: (screen as any).schedules,
    createdBy: user._id || user.id,
    companyId: user.companyId,
    visibility: (screen as any).visibility || 'private',
    previewUrl: (screen as any).previewUrl,
    previewType: (screen as any).previewType || 'image',
    status: 'offline' as const,
    lastPing: new Date()
  });

  return clonedScreen;
};

/**
 * Update screen ping
 */
const updateScreenPing = async (secretKey: string) => {
  const screen = await Screen.findOne({ secretKey });
  if (!screen) return null;
  screen.lastPing = new Date();
  screen.status = 'online';
  await screen.save();
  return screen;
};

export default {
  createScreen,
  queryScreens,
  getScreenById,
  updateScreenById,
  deleteScreenById,
  cloneScreen,
  updateScreenPing,
  restoreScreenById,
  permanentDeleteScreenById,
  deleteScreensByIds,
  getScreensByTemplateId
};
