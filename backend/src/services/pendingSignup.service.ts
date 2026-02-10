import logger from "../config/logger";
import PendingSignupModel, { IPendingSignup } from "../models/pendingSignup.model";

/**
 * Save a pending signup (database persistent)
 */
export const savePendingSignup = async (data: Partial<IPendingSignup>): Promise<void> => {
    await PendingSignupModel.findOneAndUpdate(
        { email: data.email?.toLowerCase() },
        { ...data, email: data.email?.toLowerCase() },
        { upsert: true, new: true }
    );
    logger.info(`Pending signup (DB) saved for email: ${data.email}`);
};

/**
 * Get a pending signup by email
 */
export const getPendingSignup = async (email: string): Promise<IPendingSignup | null> => {
    return PendingSignupModel.findOne({ email: email.toLowerCase() });
};

/**
 * Delete a pending signup
 */
export const deletePendingSignup = async (email: string): Promise<boolean> => {
    const result = await PendingSignupModel.deleteOne({ email: email.toLowerCase() });
    if (result.deletedCount > 0) {
        logger.info(`Pending signup (DB) deleted for email: ${email}`);
        return true;
    }
    return false;
};

/**
 * Cleanup expired pending signups (Legacy - handled by MongoDB TTL)
 */
export const cleanupExpiredSignups = async (): Promise<number> => {
    const now = new Date();
    const result = await PendingSignupModel.deleteMany({ otpExpires: { $lt: now } });
    if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} expired pending signups from DB`);
    }
    return result.deletedCount;
};

/**
 * Get total count of pending signups
 */
export const getPendingSignupsCount = async (): Promise<number> => {
    return PendingSignupModel.countDocuments();
};

logger.info("Pending signup service (MongoDB) initialized");
