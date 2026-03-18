import mongoose from "mongoose";
import config from "../src/config/config";
import User from "../src/models/user.model";

const checkUsers = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log("Connected to MongoDB for Final Verification");

        const allSmarts = await User.find({ email: /smartsigndeck/i });
        console.log(`Found ${allSmarts.length} users with 'smartsigndeck' in email:`);
        allSmarts.forEach(u => {
            console.log(` - ${u.email} (ID: ${u._id}) [Role: ${u.role}]`);
        });

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

checkUsers();
