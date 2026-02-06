import logger from "../config/logger";

export interface PendingSignup {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    companyName: string;
    authProvider: "local" | "google";
    googleId?: string;
    otp: string;
    otpExpires: Date;
    createdAt: Date;
}

// In-memory store for pending signups
// TODO: Use Redis in production for scalability
const pendingSignups = new Map<string, PendingSignup>();

/**
 * Save a pending signup
 */
export const savePendingSignup = (data: PendingSignup): void => {
    pendingSignups.set(data.email.toLowerCase(), data);
    logger.info(`Pending signup saved for email: ${data.email}`);
};

/**
 * Get a pending signup by email
 */
export const getPendingSignup = (email: string): PendingSignup | undefined => {
    return pendingSignups.get(email.toLowerCase());
};

/**
 * Delete a pending signup
 */
export const deletePendingSignup = (email: string): boolean => {
    const deleted = pendingSignups.delete(email.toLowerCase());
    if (deleted) {
        logger.info(`Pending signup deleted for email: ${email}`);
    }
    return deleted;
};

/**
 * Cleanup expired pending signups
 * Should be called periodically
 */
export const cleanupExpiredSignups = (): number => {
    const now = new Date();
    let count = 0;

    pendingSignups.forEach((signup, email) => {
        if (now > signup.otpExpires) {
            pendingSignups.delete(email);
            count++;
        }
    });

    if (count > 0) {
        logger.info(`Cleaned up ${count} expired pending signups`);
    }

    return count;
};

/**
 * Get total count of pending signups (for monitoring)
 */
export const getPendingSignupsCount = (): number => {
    return pendingSignups.size;
};

// Start cleanup job - runs every hour
setInterval(() => {
    cleanupExpiredSignups();
}, 60 * 60 * 1000);

logger.info("Pending signup service initialized");
