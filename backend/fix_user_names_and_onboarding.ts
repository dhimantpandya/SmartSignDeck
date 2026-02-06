import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";
import User from "./src/models/user.model";

dotenv.config({ path: path.join(__dirname, ".env") });

const mongoUrl = process.env.MONGO_DB_URL;
const dbName = process.env.MONGO_DB_NAME;

if (!mongoUrl || !dbName) {
    console.error("MONGO_DB_URL or MONGO_DB_NAME not found in environment");
    process.exit(1);
}

const fullUrl = mongoUrl.includes('?')
    ? mongoUrl.replace('?', `/${dbName}?`)
    : (mongoUrl.endsWith('/') ? `${mongoUrl}${dbName}` : `${mongoUrl}/${dbName}`);

const fixData = async () => {
    try {
        await mongoose.connect(fullUrl);
        console.log("Connected to MongoDB");

        // 1. Fix names for "User" generic names (case insensitive)
        const usersWithNameUser = await User.find({
            first_name: { $regex: /^user$/i }
        });

        console.log(`Found ${usersWithNameUser.length} users with generic "User" first names`);

        let namesFixed = 0;
        for (const user of usersWithNameUser) {
            const emailPrefix = user.email.split("@")[0].split(".")[0];
            const newName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            console.log(`Fixing name for ${user.email}: ${user.first_name} -> ${newName}`);
            user.first_name = newName;
            await user.save();
            namesFixed++;
        }
        console.log(`Fixed ${namesFixed} user names`);

        // 2. Fix onboarding status
        const fixedOnboardingTrue = await User.updateMany(
            { companyId: { $exists: true, $ne: null }, onboardingCompleted: false },
            { $set: { onboardingCompleted: true } }
        );
        console.log(`Updated ${fixedOnboardingTrue.modifiedCount} users to onboardingCompleted: true (had company)`);

        const fixedOnboardingFalse = await User.updateMany(
            { companyId: { $exists: false }, onboardingCompleted: true },
            { $set: { onboardingCompleted: false } }
        );
        console.log(`Updated ${fixedOnboardingFalse.modifiedCount} users to onboardingCompleted: false (missing company)`);

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error during data fix:", error);
        process.exit(1);
    }
};

fixData();
