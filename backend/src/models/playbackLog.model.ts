import mongoose, { Schema, type Document, type FilterQuery } from "mongoose";
import { toJSON, paginate } from "./plugins";
import {
    type CustomPaginateOptions,
    type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export interface IPlaybackLog extends Document {
    screenId: mongoose.Types.ObjectId;
    templateId: mongoose.Types.ObjectId;
    zoneId: string;
    contentUrl: string;
    contentType: "image" | "video" | "text";
    startTime: Date;
    endTime?: Date;
    duration?: number;
    demographics?: {
        ageRange?: string;
        gender?: string;
    };
}

export interface IPlaybackLogModel extends mongoose.Model<IPlaybackLog> {
    paginate: (
        filter: FilterQuery<IPlaybackLog>,
        options: CustomPaginateOptions,
    ) => Promise<CustomPaginateResult<IPlaybackLog>>;
}

const playbackLogSchema = new Schema<IPlaybackLog, IPlaybackLogModel>(
    {
        screenId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Screen",
            required: true,
        },
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Template",
            required: true,
        },
        zoneId: {
            type: String,
            required: true,
        },
        contentUrl: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            enum: ["image", "video", "text"],
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number, // in seconds
        },
        demographics: {
            ageRange: String,
            gender: String,
        },
    },
    {
        timestamps: true,
    },
);

// add plugin that converts mongoose to json
playbackLogSchema.plugin(toJSON);
playbackLogSchema.plugin(paginate);

// Add TTL index (auto-delete after 90 days)
playbackLogSchema.index(
    { startTime: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

const PlaybackLog = mongoose.model<IPlaybackLog, IPlaybackLogModel>(
    "PlaybackLog",
    playbackLogSchema,
);

export default PlaybackLog;
