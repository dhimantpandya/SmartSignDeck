import Playlist, { type IPlaylist } from "../models/playlist.model";
import { type FilterQuery, type UpdateQuery } from "mongoose";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { type CustomPaginateOptions } from "../models/plugins/paginate.plugin";

/**
 * Create a playlist
 * @param {Object} playlistBody
 * @returns {Promise<IPlaylist>}
 */
const createPlaylist = async (playlistBody: IPlaylist): Promise<IPlaylist> => {
    return await Playlist.create(playlistBody);
};

/**
 * Query for playlists
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPlaylists = async (filter: FilterQuery<IPlaylist>, options: CustomPaginateOptions, user: any) => {
    const finalFilter: any = { ...filter };

    if (user.role !== "super_admin") {
        const companyIdStr = (user.companyId || "").toString();
        const userIdStr = (user.id || user._id || "").toString();

        if (user.role === 'admin') {
            if (companyIdStr) finalFilter.companyId = companyIdStr;
        } else {
            // Regular user: Only own content
            if (userIdStr) finalFilter.createdBy = userIdStr;
        }
    }

    return await Playlist.paginate(finalFilter, options);
};

/**
 * Get playlist by id
 * @param {ObjectId} id
 * @returns {Promise<IPlaylist | null>}
 */
const getPlaylistById = async (id: string): Promise<IPlaylist | null> => {
    return await Playlist.findById(id);
};

/**
 * Update playlist by id
 * @param {ObjectId} playlistId
 * @param {Object} updateBody
 * @param {String} companyId - Ensure ownership
 * @returns {Promise<IPlaylist>}
 */
const updatePlaylistById = async (
    playlistId: string,
    updateBody: UpdateQuery<IPlaylist>,
    companyId: string
): Promise<IPlaylist> => {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Playlist not found");
    }
    if (playlist.companyId.toString() !== companyId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
    }

    Object.assign(playlist, updateBody);
    await playlist.save();
    return playlist;
};

/**
 * Delete playlist by id
 * @param {ObjectId} playlistId
 * @param {String} companyId - Ensure ownership
 * @returns {Promise<IPlaylist>}
 */
const deletePlaylistById = async (playlistId: string, companyId: string): Promise<IPlaylist> => {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Playlist not found");
    }
    if (playlist.companyId.toString() !== companyId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
    }
    await playlist.deleteOne();
    return playlist;
};

/**
 * Delete multiple playlists by ids
 * @param {string[]} ids
 * @param {string} companyId- Ensure ownership
 * @returns {Promise<Object>}
 */
const deletePlaylistsByIds = async (ids: string[], companyId: string) => {
    const validIdsToDelete: string[] = [];
    const errors: string[] = [];

    for (const playlistId of ids) {
        const playlist = await getPlaylistById(playlistId);
        if (!playlist) continue;

        if (playlist.companyId.toString() !== companyId.toString()) {
            errors.push(`Playlist ${playlist.name}: Permission denied`);
            continue;
        }

        validIdsToDelete.push(playlistId);
    }

    if (validIdsToDelete.length === 0 && errors.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Cannot delete selected playlists: ${errors.join(", ")}`);
    }

    const result = await Playlist.deleteMany({
        _id: { $in: validIdsToDelete }
    });

    return {
        deletedCount: result.deletedCount,
        errors: errors.length > 0 ? errors : undefined
    };
};

export {
    createPlaylist,
    queryPlaylists,
    getPlaylistById,
    updatePlaylistById,
    deletePlaylistById,
    deletePlaylistsByIds,
};
