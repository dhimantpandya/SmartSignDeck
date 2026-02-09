
import User from "../models/user.model";
import Company from "../models/company.model";
import { FriendRequest } from "../models/social.model";
import logger from "../config/logger";

/**
 * Setup default super admin and auto-collaboration
 */
const setupDefaultAdmin = async () => {
    try {
        const email = "smartsigndeck@gmail.com";
        let user = await User.findOne({ email });

        if (user) {
            logger.info("Super admin user check: user already exists. Updating check...");
            user.first_name = "Smart";
            user.last_name = "SignDeck";
            user.role = "super_admin";
            user.avatar = "/images/favicon.svg";
            user.is_email_verified = true;
            user.onboardingCompleted = true;
            await user.save();
        } else {
            logger.info("Super admin user check: creating super admin user...");
            user = await User.create({
                email,
                password: "Password123!", // Default password
                first_name: "Smart",
                last_name: "SignDeck",
                role: "super_admin",
                authProvider: "local",
                avatar: "/images/favicon.svg",
                is_email_verified: true,
                onboardingCompleted: true
            });
        }

        // Setup Company
        let company = await Company.findOne({ name: "smartsigndeck" });
        if (company) {
            company.ownerId = user._id;
            await company.save();
        } else {
            logger.info("Company check: creating company 'smartsigndeck'...");
            company = await Company.create({
                name: "smartsigndeck",
                ownerId: user._id,
                isActive: true
            });
        }

        // Link user to company
        if (user.companyId?.toString() !== company._id.toString()) {
            user.companyId = company._id;
            user.companyName = undefined;
            await user.save();
            logger.info("User linked to company.");
        }

        // Connect all existing users to smartsigndeck
        const allUsers = await User.find({ _id: { $ne: user._id } });
        let connectionCount = 0;

        for (const otherUser of allUsers) {
            const existingRequest = await FriendRequest.findOne({
                $or: [
                    { fromId: user._id, toId: otherUser._id },
                    { fromId: otherUser._id, toId: user._id }
                ]
            });

            if (!existingRequest) {
                await FriendRequest.create({
                    fromId: user._id,
                    toId: otherUser._id,
                    status: "accepted"
                });
                connectionCount++;
            } else if (existingRequest.status !== "accepted") {
                existingRequest.status = "accepted";
                await existingRequest.save();
                connectionCount++;
            }
        }

        if (connectionCount > 0) {
            logger.info(`Established ${connectionCount} new/updated connections with existing users.`);
        }
    } catch (error) {
        logger.error("Error in seed service (setupDefaultAdmin):", error);
    }
};

export default {
    setupDefaultAdmin,
};
