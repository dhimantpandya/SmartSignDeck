import mongoose from 'mongoose';
import Company from '../models/company.model';
import User from '../models/user.model';
import logger from '../config/logger';

/**
 * Normalizes company names, merges duplicates, and links orphaned users.
 * This runs on server startup to ensure data integrity across environments.
 */
const runCompanyMigration = async () => {
    try {
        logger.info('[Migration] Starting company data normalization...');

        // 1. Normalize and Merge Companies
        const companies = await Company.find();
        const companyMap = new Map(); // normalizedName -> canonicalRecord

        for (const company of companies) {
            if (!company.name) continue;
            const normalizedName = company.name.trim().toLowerCase();

            if (!companyMap.has(normalizedName)) {
                // First record with this name becomes the canonical one
                if (company.name !== normalizedName) {
                    company.name = normalizedName;
                    await company.save();
                }
                companyMap.set(normalizedName, company);
            } else {
                // Duplicate found!
                const canonical = companyMap.get(normalizedName);
                logger.info(`[Migration] Merging duplicate company "${normalizedName}" (${company._id} -> ${canonical._id})`);

                // Move all users to the canonical ID
                await User.updateMany(
                    { companyId: company._id },
                    { companyId: canonical._id, companyName: canonical.name }
                );

                // Delete the duplicate
                await Company.findByIdAndDelete(company._id);
            }
        }

        // 2. Fix Orphaned Users (Users with companyName but no companyId)
        const orphanedUsers = await User.find({
            companyName: { $exists: true, $ne: '' },
            companyId: { $exists: false }
        });

        if (orphanedUsers.length > 0) {
            logger.info(`[Migration] Found ${orphanedUsers.length} orphaned users. Linking...`);

            for (const user of orphanedUsers) {
                if (!user.companyName) continue;
                const normalizedName = user.companyName.trim().toLowerCase();

                let company = await Company.findOne({ name: normalizedName });
                if (!company) {
                    logger.info(`[Migration] Creating missing company record for "${normalizedName}"`);
                    company = await Company.create({
                        name: normalizedName,
                        ownerId: user._id,
                        isActive: true
                    });
                }

                user.companyId = company._id as any;
                user.companyName = company.name;
                await user.save();
            }
        }

        // 3. Ensure all users' companyName matches the canonical casing from Company record
        const usersToSync = await User.find({ companyId: { $exists: true } });
        for (const user of usersToSync) {
            const company = await Company.findById(user.companyId);
            if (company && user.companyName !== company.name) {
                user.companyName = company.name;
                await user.save();
            }
        }

        logger.info('[Migration] Company data normalization completed.');
    } catch (error) {
        logger.error('[Migration] Company migration failed:', error);
    }
};

export default {
    runCompanyMigration,
};
