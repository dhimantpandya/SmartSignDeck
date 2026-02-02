import { PlaybackLog } from "../models";

/**
 * Create a playback log
 * @param {Object} logBody
 * @returns {Promise<PlaybackLog>}
 */
const createPlaybackLog = async (logBody: any) => {
    return await PlaybackLog.create(logBody);
};

/**
 * Query for playback logs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryPlaybackLogs = async (filter: any, options: any) => {
    const logs = await PlaybackLog.paginate(filter, options);
    return logs;
};

export default {
    createPlaybackLog,
    queryPlaybackLogs,
};
