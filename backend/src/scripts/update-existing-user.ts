import mongoose from "mongoose";
import config from "../config/config";
import User from "../models/user.model";
import logger from "../config/logger";

const updateExistingGoogleUser = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        logger.info("Connected to MongoDB for updating existing Google user");

        const email = "dhimantpandya6@gmail.com"; // Update with the actual email
        const user = await User.findOne({ email });

        if (user) {
            logger.info(`Found user: ${user.first_name} ${user.last_name}`);

            // Update the name if it's "Google User"
            if (user.first_name === "Google" && user.last_name === "User") {
                user.first_name = "Dhimant"; // Update with actual first name
                user.last_name = "Pandya"; // Update with actual last name
            }

            // Update role to 'user' if it's 'admin'
            if (user.role === "admin") {
                user.role = "user";
            }

            await user.save();
            logger.info("User updated successfully.");
            logger.info(`New name: ${user.first_name} ${user.last_name}, Role: ${user.role}`);
        } else {
            logger.info("User not found.");
        }

        process.exit(0);
    } catch (error) {
        logger.error("Error updating user:", error);
        process.exit(1);
    }
};

updateExistingGoogleUser();
