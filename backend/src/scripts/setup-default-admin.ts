
import mongoose from "mongoose";
import config from "../config/config";
import User from "../models/user.model";
import Company from "../models/company.model";
import { FriendRequest } from "../models/social.model";
import logger from "../config/logger";

const setupDefaultAdmin = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        logger.info("Connected to MongoDB for seeding");

        const email = "smartsigndeck@gmail.com";
        let user = await User.findOne({ email });

        if (user) {
            logger.info("Super admin user already exists. Updating data...");
            user.first_name = "Smart";
            user.last_name = "SignDeck";
            user.role = "super_admin";
            user.avatar = "/images/favicon.svg";
            user.is_email_verified = true;
            user.onboardingCompleted = true;
            await user.save();
            logger.info("Super admin user updated.");
        } else {
            logger.info("Creating super admin user...");
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
            logger.info("Super admin user created successfully.");
        }

        // Setup Company
        let company = await Company.findOne({ name: "smartsigndeck" });
        if (company) {
            logger.info("Company already exists. Updating owner...");
            company.ownerId = user._id;
            await company.save();
        } else {
            logger.info("Creating company 'smartsigndeck'...");
            company = await Company.create({
                name: "smartsigndeck",
                ownerId: user._id,
                isActive: true
            });
        }

        // Link user to company
        user.companyId = company._id;
        user.companyName = undefined; // Clear temp field if exists
        await user.save();
        logger.info("User linked to company.");

        // Connect all existing users to smartsigndeck
        logger.info("Checking for missing connections...");
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

        logger.info(`Established ${connectionCount} new/updated connections with existing users.`);
        logger.info("Setup complete.");
        process.exit(0);
    } catch (error) {
        logger.error("Error setting up default admin:", error);
        process.exit(1);
    }
};

setupDefaultAdmin();
