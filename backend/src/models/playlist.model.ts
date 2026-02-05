import mongoose, { Schema, type Document, type FilterQuery } from "mongoose";
import { paginate, toJSON } from "./plugins";
import {
    type CustomPaginateOptions,
    type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export interface IPlaylistItem {
    url: string;
    type: "image" | "video";
    duration: number; // in seconds
    name?: string;
}

export interface IPlaylist extends Document {
    name: string;
    companyId: mongoose.Schema.Types.ObjectId;
    items: IPlaylistItem[];
    createdBy: mongoose.Schema.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

export interface IPlaylistModel extends mongoose.Model<IPlaylist> {
    paginate: (
        filter: FilterQuery<IPlaylist>,
        options: CustomPaginateOptions,
    ) => Promise<CustomPaginateResult<IPlaylist>>;
}

const playlistSchema = new Schema<IPlaylist, IPlaylistModel>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },
        items: [
            {
                url: { type: String, required: true },
                type: { type: String, enum: ["image", "video"], required: true },
                duration: { type: Number, default: 10 },
                name: { type: String },
            },
        ],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// add plugin that converts mongoose to json
playlistSchema.plugin(toJSON);
playlistSchema.plugin(paginate);

const Playlist = mongoose.model<IPlaylist, IPlaylistModel>(
    "Playlist",
    playlistSchema,
);

export default Playlist;
