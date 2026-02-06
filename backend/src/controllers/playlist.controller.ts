import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { playlistService } from "../services";
import { type Request, type Response } from "express";

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
    const filter = pick(req.query, ["name"]);
    // Enforce company isolation
    filter.companyId = user.companyId;

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

export {
    createPlaylist,
    getPlaylists,
    getPlaylist,
    updatePlaylist,
    deletePlaylist,
};
