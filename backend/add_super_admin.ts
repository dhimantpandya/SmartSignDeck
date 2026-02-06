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

const addSuperAdmin = async () => {
    try {
        await mongoose.connect(fullUrl);
        console.log("Connected to MongoDB");

        const email = "smartsigndeck@gmail.com";
        const firstName = "SmartSignDeck";
        const lastName = "";
        const role = "super_admin";

        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log(`User ${email} already exists. Updating role to ${role}...`);
            user.role = role;
            user.first_name = firstName;
            user.onboardingCompleted = true; // Super admins should have this true
            await user.save();
            console.log("User updated successfully.");
        } else {
            console.log(`Creating new super_admin user: ${email}`);
            await User.create({
                email: email.toLowerCase(),
                first_name: firstName,
                last_name: lastName,
                role: role,
                authProvider: "google", // Assuming Google for now as per previous context
                is_email_verified: true,
                onboardingCompleted: true,
                password: "DefaultPassword123!" // Required for local/required fields if any
            });
            console.log("User created successfully.");
        }

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error adding super admin:", error);
        process.exit(1);
    }
};

addSuperAdmin();
