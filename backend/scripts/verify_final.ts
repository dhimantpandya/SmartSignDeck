import mongoose from "mongoose";
import config from "../src/config/config";
import User from "../src/models/user.model";

const verifyFinalState = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        console.log("=== FINAL DATABASE VERIFICATION ===");

        const oldEmail = "smartsigndeck@gmail.com";
        const newEmail = "smartsigndeckk@gmail.com";

        const oldUser = await User.findOne({ email: oldEmail });
        const newUser = await User.findOne({ email: newEmail });

        console.log(`Old Account (${oldEmail}): ${oldUser ? "EXISTS (FAILURE)" : "CLEANED (SUCCESS)"}`);
        console.log(`New Account (${newEmail}): ${newUser ? "EXISTS (READY)" : "NOT FOUND (WARNING)"}`);

        if (newUser) {
            console.log(`New Account ID: ${newUser._id}`);
        }

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyFinalState();
