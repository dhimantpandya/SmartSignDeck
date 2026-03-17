import mongoose, { Schema, type Document, type Model } from "mongoose";
import { toJSON, paginate } from "./plugins";
import { type CustomPaginateOptions, type CustomPaginateResult } from "./plugins/paginate.plugin";

export interface ICollaborationRequest extends Document {
    sender: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    templateId: mongoose.Types.ObjectId;
    status: "pending" | "accepted" | "declined" | "cancelled";
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICollaborationRequestModel extends Model<ICollaborationRequest> {
    paginate: (
        filter: mongoose.FilterQuery<ICollaborationRequest>,
        options: CustomPaginateOptions
    ) => Promise<CustomPaginateResult<ICollaborationRequest>>;
}

const collaborationRequestSchema = new Schema<ICollaborationRequest, ICollaborationRequestModel>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        templateId: {
            type: Schema.Types.ObjectId,
            ref: "Template",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined", "cancelled"],
            default: "pending",
            index: true,
        },
        message: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

collaborationRequestSchema.plugin(toJSON);
collaborationRequestSchema.plugin(paginate);

/**
 * @typedef CollaborationRequest
 */
const CollaborationRequest = mongoose.model<ICollaborationRequest, ICollaborationRequestModel>(
    "CollaborationRequest",
    collaborationRequestSchema
);

export default CollaborationRequest;
