import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import screenService from "../services/screen.service";
import { emitToScreen, getIO } from "../services/socket.service";
import mongoose from "mongoose";

const createScreen = catchAsync(async (req: Request, res: Response) => {
  const screen = await screenService.createScreen(req.body, req.user as any);
  const io = getIO();
  if (io && screen.isPublic) {
    io.emit('screen_published', { screenId: screen._id || screen.id });
  }
  successResponse(
    res,
    "Screen created successfully",
    httpStatus.CREATED,
    screen,
  );
});

const getScreens = catchAsync(async (req: Request, res: Response) => {
  const filter: any = pick(req.query, ["name", "templateId", "status", "createdBy", "isPublic", "visibility", "trashed", "companyId"]);

  // Handle boolean strings
  if (filter.isPublic === 'true') filter.isPublic = true;
  if (filter.isPublic === 'false') filter.isPublic = false;
  if (filter.trashed === 'true') filter.trashed = true;
  if (filter.trashed === 'false') filter.trashed = false;

  // Explicit ObjectId casting for filters
  if (filter.createdBy && mongoose.Types.ObjectId.isValid(filter.createdBy)) {
    filter.createdBy = new mongoose.Types.ObjectId(filter.createdBy);
  }
  if (filter.companyId && mongoose.Types.ObjectId.isValid(filter.companyId)) {
    filter.companyId = new mongoose.Types.ObjectId(filter.companyId);
  }

  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await screenService.queryScreens(filter, options, req.user as any);

  successResponse(res, "Screens retrieved successfully", httpStatus.OK, result);
});

const getScreen = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.query;
  const screen = await screenService.getScreenById(req.params.screenId, req.user as any, key as string);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Screen not found");
  }
  successResponse(res, "Screen retrieved successfully", httpStatus.OK, screen);
});

const updateScreen = catchAsync(async (req: Request, res: Response) => {
  const screen = await screenService.updateScreenById(
    req.params.screenId,
    req.body,
    req.user as any
  );

  // Notify the player of the update
  emitToScreen(req.params.screenId, "content_update", {
    reason: "screen_updated",
    screenId: req.params.screenId
  });

  const io = getIO();
  if (io) {
      if (screen.isPublic) io.emit('screen_published', { screenId: screen._id || screen.id });
      io.emit('screen_updated', { screenId: screen._id || screen.id });
  }

  successResponse(res, "Screen updated successfully", httpStatus.OK, screen);
});

const deleteScreen = catchAsync(async (req: Request, res: Response) => {
  await screenService.deleteScreenById(req.params.screenId, req.user as any);
  const io = getIO();
  if (io) io.emit('screen_deleted', { screenId: req.params.screenId });
  res.status(httpStatus.NO_CONTENT).send();
});

const restoreScreen = catchAsync(async (req: Request, res: Response) => {
  const screen = await screenService.restoreScreenById(req.params.screenId, req.user as any);
  const io = getIO();
  if (io) {
      if (screen.isPublic) io.emit('screen_published', { screenId: screen._id || screen.id });
      io.emit('screen_updated', { screenId: screen._id || screen.id });
  }
  successResponse(res, "Screen restored successfully", httpStatus.OK, screen);
});

const permanentDeleteScreen = catchAsync(async (req: Request, res: Response) => {
  await screenService.permanentDeleteScreenById(req.params.screenId, req.user as any);
  const io = getIO();
  if (io) io.emit('screen_deleted', { screenId: req.params.screenId });
  res.status(httpStatus.NO_CONTENT).send();
});

const bulkDeleteScreens = catchAsync(async (req: Request, res: Response) => {
  const result = await screenService.deleteScreensByIds(req.body.ids, req.user as any);
  const io = getIO();
  if (io && req.body.ids && Array.isArray(req.body.ids)) {
      req.body.ids.forEach((id: string) => io.emit('screen_deleted', { screenId: id }));
  }
  successResponse(
    res,
    "Screens processed for deletion",
    httpStatus.OK,
    result,
  );
});

const cloneScreen = catchAsync(async (req: Request, res: Response) => {
  const screen = await screenService.cloneScreen(req.params.screenId, req.user as any);
  successResponse(
    res,
    "Screen cloned successfully",
    httpStatus.CREATED,
    screen,
  );
});

const pingScreen = catchAsync(async (req: Request, res: Response) => {
  // Ping is a special anonymous/player endpoint usually, 
  // but we should verify it exists and is owned by the right company if we are strict.
  // For now, we allow the ping if the screen exists.
  const screen = await screenService.getScreenById(req.params.screenId);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Screen not found");
  }

  // Update lastPing
  Object.assign(screen, { lastPing: new Date(), status: "online" });
  await screen.save();

  res.status(httpStatus.OK).send(screen);
});

const refreshScreen = catchAsync(async (req: Request, res: Response) => {
  const { screenId } = req.params;
  const user: any = req.user;

  // Verify screen exists and user has permission
  const screen = await screenService.getScreenById(screenId, user);
  if (!screen) {
    throw new ApiError(httpStatus.NOT_FOUND, "Screen not found");
  }

  // Emit socket command
  emitToScreen(screenId, "screen_command", { command: "force_refresh" });

  successResponse(
    res,
    "Refresh command sent",
    httpStatus.OK,
    { screenId }
  );
});

export default {
  createScreen,
  getScreens,
  getScreen,
  updateScreen,
  deleteScreen,
  bulkDeleteScreens,
  restoreScreen,
  permanentDeleteScreen,
  pingScreen,
  refreshScreen,
  cloneScreen,
};
