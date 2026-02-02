import mongoose, { Schema, type Document } from "mongoose";
import { toJSON, paginate } from "./plugins";

// FRIEND REQUEST MODEL
export interface IFriendRequest extends Document {
    fromId: mongoose.Schema.Types.ObjectId;
    toId: mongoose.Schema.Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
    created_at: Date;
    updated_at: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>(
    {
        fromId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        toId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

friendRequestSchema.plugin(toJSON);
friendRequestSchema.plugin(paginate);

export const FriendRequest = mongoose.model<IFriendRequest>("FriendRequest", friendRequestSchema);

// MESSAGE MODEL
export interface IMessage extends Document {
    senderId: mongoose.Schema.Types.ObjectId;
    recipientId?: mongoose.Schema.Types.ObjectId; // For DM
    companyId?: mongoose.Schema.Types.ObjectId;   // For Company Wall
    text: string;
    created_at: Date;
    updated_at: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        companyId: {
            type: Schema.Types.ObjectId,
            ref: "Company",
            index: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

messageSchema.plugin(toJSON);
messageSchema.plugin(paginate);

export const Message = mongoose.model<IMessage>("Message", messageSchema);
