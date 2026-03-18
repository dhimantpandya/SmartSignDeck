import mongoose from "mongoose";
import config from "../src/config/config";
import User from "../src/models/user.model";
import { FriendRequest } from "../src/models/social.model";

const OLD_EMAIL = "smartsigndeck@gmail.com";

const removeOldFriend = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log("Connected to MongoDB");

        const oldAdmin = await User.findOne({ email: OLD_EMAIL });
        if (!oldAdmin) {
            console.log(`User ${OLD_EMAIL} not found. Exiting.`);
            process.exit(0);
        }

        console.log(`Found old admin: ${OLD_EMAIL} (ID: ${oldAdmin._id})`);

        // Delete all friendship connections where the old admin is involved
        const deleteResult = await FriendRequest.deleteMany({
            $or: [
                { fromId: oldAdmin._id },
                { toId: oldAdmin._id }
            ]
        });

        console.log(`Successfully removed ${deleteResult.deletedCount} friend connections associated with ${OLD_EMAIL}!`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

removeOldFriend();
