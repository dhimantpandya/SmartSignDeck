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
const queryPlaylists = async (filter: FilterQuery<IPlaylist>, options: CustomPaginateOptions) => {
    return await Playlist.paginate(filter, options);
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

export {
    createPlaylist,
    queryPlaylists,
    getPlaylistById,
    updatePlaylistById,
    deletePlaylistById,
};
