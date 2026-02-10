import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    recipientId: mongoose.Schema.Types.ObjectId;
    senderId?: mongoose.Schema.Types.ObjectId;
    type: "friend_request" | "new_chat" | "company_invite" | "system_alert";
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, any>;
    status: "active" | "archived";
    created_at: Date;
}

const notificationSchema = new Schema(
    {
        recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User" },
        type: {
            type: String,
            enum: ["friend_request", "new_chat", "company_invite", "system_alert"],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        data: { type: Object, default: {} },
        status: { type: String, enum: ["active", "archived"], default: "active" },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
