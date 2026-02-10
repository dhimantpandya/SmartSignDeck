import mongoose, { Schema, Document } from "mongoose";
import { toJSON } from "./plugins";

export interface IPendingSignup extends Document {
    email: string;
    first_name: string;
    last_name: string;
    password?: string;
    companyName?: string;
    authProvider: "local" | "google";
    googleId?: string;
    otp: string;
    otpExpires: Date;
    created_at: Date;
    updated_at: Date;
}

const pendingSignupSchema = new Schema<IPendingSignup>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        first_name: {
            type: String,
            required: true,
            trim: true,
        },
        last_name: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            trim: true,
        },
        companyName: {
            type: String,
            trim: true,
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            required: true,
        },
        googleId: {
            type: String,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        otpExpires: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
);

// TTL index to automatically remove expired pending signups after 1 hour of expiry
pendingSignupSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 3600 });
pendingSignupSchema.plugin(toJSON);

const PendingSignup = mongoose.model<IPendingSignup>("PendingSignup", pendingSignupSchema);

export default PendingSignup;
