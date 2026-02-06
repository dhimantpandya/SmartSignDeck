
import mongoose from "mongoose";
import config from "../config/config";
import User from "../models/user.model";
import logger from "../config/logger";

const seedAdmin = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        logger.info("Connected to MongoDB for seeding");

        const email = "smartsigndeck@gmail.com";
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            logger.info("Super admin already exists. Updating role/data if needed...");
            existingUser.role = "super_admin";
            existingUser.companyName = "smartsigndeck";
            // Could update password if needed, but safer to leave it if they changed it
            await existingUser.save();
            logger.info("Super admin updated.");
        } else {
            logger.info("Creating super admin...");
            await User.create({
                email: "smartsigndeck@gmail.com",
                password: "Password123!", // Initial default password
                first_name: "Smart",
                last_name: "SignDeck",
                role: "super_admin",
                companyName: "smartsigndeck",
                authProvider: "local",
                is_email_verified: true,
                onboardingCompleted: true
            });
            logger.info("Super admin created successfully.");
        }

        process.exit(0);
    } catch (error) {
        logger.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
