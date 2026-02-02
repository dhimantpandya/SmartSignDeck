import { Screen, Template } from "../models";
import logger from "../config/logger";

/**
 * Permanently delete screens and templates that have been soft-deleted for more than 30 days
 */
const purgeOldDeletedItems = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        // Purge Screens
        const screenDeleteResult = await Screen.deleteMany({
            deletedAt: { $ne: null, $lt: thirtyDaysAgo },
        });
        if (screenDeleteResult.deletedCount > 0) {
            logger.info(`Purged ${screenDeleteResult.deletedCount} old deleted screens`);
        }

        // Purge Templates
        const templateDeleteResult = await Template.deleteMany({
            deletedAt: { $ne: null, $lt: thirtyDaysAgo },
        });
        if (templateDeleteResult.deletedCount > 0) {
            logger.info(`Purged ${templateDeleteResult.deletedCount} old deleted templates`);
        }
    } catch (error) {
        logger.error("Error during old deleted items purge:", error);
    }
};

/**
 * Start the cleanup job
 * Runs every 24 hours
 */
const startCleanupJob = () => {
    // Initial run
    purgeOldDeletedItems();

    // Run every 24 hours
    setInterval(purgeOldDeletedItems, 24 * 60 * 60 * 1000);
    logger.info("Cleanup job for old deleted items started");
};

export default {
    startCleanupJob,
    purgeOldDeletedItems,
};
