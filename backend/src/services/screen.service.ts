import mongoose from "mongoose";
import httpStatus from "http-status";
import logger from "../config/logger";
import Screen from "../models/screen.model";
import Template from "../models/template.model";
import Playlist from "../models/playlist.model";
import ApiError from "../utils/ApiError";
import crypto from "crypto";
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
    secretKey: crypto.randomBytes(16).toString("hex"),
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
  // 1. Clean up filter
  const finalFilter: any = { deletedAt: null, ...filter };

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
        // Fallback for users without company (shouldn't happen with ensureUserCompany)
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
      // This ensures the "My Screens" list is correctly isolated to the current account.
      if (isQueryingOwn && userIdStr && mongoose.Types.ObjectId.isValid(userIdStr)) {
        finalFilter.createdBy = new mongoose.Types.ObjectId(userIdStr);
      }
    }
  }


  const screens = await Screen.paginate(finalFilter, {
    ...options,
    populate: [
      { path: "templateId" },
      { path: "createdBy", select: "id _id first_name last_name email avatar" }
    ],
  });

  // 🕒 DYNAMIC STATUS CALCULATION
  // A screen is 'online' ONLY if it has pinged within the last 2 minutes
  const TWO_MINUTES_AGO = new Date(Date.now() - 2 * 60 * 1000);

  if (screens.results) {
    screens.results = screens.results.map((screen: any) => {
      const screenObj = screen.toObject ? screen.toObject() : screen;
      const lastPing = screenObj.lastPing ? new Date(screenObj.lastPing) : null;

      if (lastPing && lastPing > TWO_MINUTES_AGO) {
        screenObj.status = "online";
      } else {
        screenObj.status = "offline";
      }

      return screenObj;
    });
  }

  return screens;
};

/**
 * Get screen by id
 * @param {ObjectId} id
 * @param {IUser} user
 * @param {string} key - Optional secret key for playback
 * @returns {Promise<Screen>}
 */
const getScreenById = async (id: string, user?: IUser, key?: string) => {
  const screen = await Screen.findById(id).populate("templateId") as any;

  if (!screen) return null;

  // 🛡️ PERMISSION CHECK
  // Allow if: Super Admin OR Owner OR Public OR Secret Key matches
  console.log('[DEBUG_AUTH] ID:', id, 'Key provided:', key, 'Stored Key:', screen.secretKey);
  let isAuthorized = false;

  if (user) {
    if (user.role === "super_admin") isAuthorized = true;
    else if (screen.companyId?.toString() === user.companyId?.toString()) isAuthorized = true;
  }

  if (screen.isPublic) isAuthorized = true;
  if (key && screen.secretKey === key) isAuthorized = true;

  if (!isAuthorized) {
    throw new ApiError(httpStatus.FORBIDDEN, `Forbidden: Access denied. Expected: '${screen.secretKey}', Received: '${key}'`);
  }

  if (screen) {
    // 🕒 DYNAMIC STATUS CALCULATION
    const TWO_MINUTES_AGO = new Date(Date.now() - 2 * 60 * 1000);
    const screenObj = screen.toObject ? screen.toObject() : screen;
    const lastPing = screenObj.lastPing ? new Date(screenObj.lastPing) : null;

    if (lastPing && lastPing > TWO_MINUTES_AGO) {
      screenObj.status = "online";
    } else {
      screenObj.status = "offline";
    }

    // Hydrate Shared Playlists
    const playlistIds = new Set<string>();

    // 1. Collect IDs from defaultContent
    if (screen.defaultContent) {
      Object.values(screen.defaultContent).forEach((content: any) => {
        if (content.sourceType === 'playlist' && content.playlistId) {
          playlistIds.add(content.playlistId.toString());
        }
      });
    }

    // 2. Collect IDs from schedules
    if (screen.schedules) {
      screen.schedules.forEach((schedule: any) => {
        if (schedule.content) {
          Object.values(schedule.content).forEach((content: any) => {
            if (content.sourceType === 'playlist' && content.playlistId) {
              playlistIds.add(content.playlistId.toString());
            }
          });
        }
      });
    }

    if (playlistIds.size > 0) {
      const playlists = await Playlist.find({
        _id: { $in: Array.from(playlistIds) },
        companyId: screen.companyId // 🛡️ Strict Isolation: Only allow playlists from the SAME company
      });
      const playlistMap = new Map(playlists.map(p => [p.id, p]));

      // Helper to hydration
      const hydrateContent = (contentObj: any) => {
        Object.keys(contentObj).forEach(key => {
          const content = contentObj[key];
          if (content.sourceType === 'playlist' && content.playlistId) {
            const playlist = playlistMap.get(content.playlistId.toString());
            if (playlist) {
              // Inject items into the playlist array for the player/frontend to use directly
              content.playlist = playlist.items;
            }
          }
        });
      };

      const screenObj = screen.toObject();
      if (screenObj.defaultContent) hydrateContent(screenObj.defaultContent);
      if (screenObj.schedules) {
        screenObj.schedules.forEach((s: any) => {
          if (s.content) hydrateContent(s.content);
        });
      }
      return screenObj;
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

import templateService from "./template.service";

/**
 * Clone a screen for the current user
 * @param {ObjectId} screenId
 * @param {IUser} user
 * @returns {Promise<Screen>}
 */
const cloneScreen = async (screenId: string, user: IUser) => {
  const originalScreen = await getScreenById(screenId, user);
  if (!originalScreen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Original screen not found");
  }

  let targetTemplateId = originalScreen.templateId;
  const originalTemplate = originalScreen.templateId as any;

  // Check if we need to clone the template too
  // If the template belongs to another company, clone it so the user can edit it
  if (originalTemplate.companyId?.toString() !== user.companyId?.toString()) {
    const clonedTemplate = await templateService.cloneTemplate(originalTemplate._id.toString(), user);
    targetTemplateId = clonedTemplate._id;
  }

  const payload = {
    name: `Copy of ${originalScreen.name}`,
    location: originalScreen.location,
    templateId: targetTemplateId,
    defaultContent: originalScreen.defaultContent,
    schedules: originalScreen.schedules,
    companyId: user.companyId,
    createdBy: user._id,
    isPublic: false,
  };

  return await Screen.create(payload);
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
  cloneScreen,
};
