import mongoose from "mongoose";
import config from "../config/config";
import User from "../models/user.model";
import logger from "../config/logger";

const checkUser = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        logger.info("Connected to MongoDB");

        const email = "dhimantpandya6@gmail.com";
        const user = await User.findOne({ email });

        if (user) {
            console.log("=== USER DATA ===");
            console.log("Email:", user.email);
            console.log("First Name:", user.first_name);
            console.log("Last Name:", user.last_name);
            console.log("Role:", user.role);
            console.log("Auth Provider:", user.authProvider);
            console.log("Company:", user.companyName);
            console.log("================");
        } else {
            logger.info("User not found.");
        }

        process.exit(0);
    } catch (error) {
        logger.error("Error checking user:", error);
        process.exit(1);
    }
};

checkUser();
