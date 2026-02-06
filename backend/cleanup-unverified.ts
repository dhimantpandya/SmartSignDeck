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

console.log(`Connecting to: ${fullUrl.replace(/:([^:@]+)@/, ':****@')}`);

const cleanup = async () => {
    try {
        await mongoose.connect(fullUrl);
        console.log("Connected to MongoDB");

        const result = await User.deleteMany({ is_email_verified: false });
        console.log(`Deleted ${result.deletedCount} unverified users`);

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
};

cleanup();
