import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { playlistService } from "../services";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";

const createPlaylist = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }
    const user = req.user as any;
    const playlist = await playlistService.createPlaylist({
        ...req.body,
        companyId: user.companyId,
        createdBy: user.id,
    });
    res.status(httpStatus.CREATED).send(playlist);
});

const getPlaylists = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }
    const user = req.user as any;
    const filter = pick(req.query, ["name", "createdBy"]);
    // Enforce company isolation
    if (user.role !== "super_admin") {
        filter.companyId = user.companyId;

        // 🔒 Personal Isolation: If frontend requests 'createdBy', honor it.
        // Otherwise, regular users only see their own work in the personal model.
        if (!filter.createdBy) {
            filter.createdBy = user.id;
        }
    }

    const options = pick(req.query, ["sortBy", "limit", "page"]);
    const result = await playlistService.queryPlaylists(filter, options);
    res.send(result);
});

const getPlaylist = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }
    const user = req.user as any;
    const playlist = await playlistService.getPlaylistById(req.params.playlistId);
    if (!playlist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Playlist not found");
    }
    // Check permission
    if (playlist.companyId.toString() !== user.companyId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
    }
    res.send(playlist);
});

const updatePlaylist = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }
    const user = req.user as any;
    const playlist = await playlistService.updatePlaylistById(
        req.params.playlistId,
        req.body,
        user.companyId.toString()
    );
    res.send(playlist);
});

const deletePlaylist = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    }
    const user = req.user as any;
    await playlistService.deletePlaylistById(req.params.playlistId, user.companyId.toString());
    res.status(httpStatus.NO_CONTENT).send();
});

const bulkDeletePlaylists = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as any;
    const result = await playlistService.deletePlaylistsByIds(req.body.ids, user.companyId.toString());
    successResponse(
        res,
        "Playlists processed for deletion",
        httpStatus.OK,
        result,
    );
});

export {
    createPlaylist,
    getPlaylists,
    getPlaylist,
    updatePlaylist,
    deletePlaylist,
    bulkDeletePlaylists,
};
