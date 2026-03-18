import mongoose from "mongoose";
import config from "../src/config/config";
import { FriendRequest } from "../src/models/social.model";

const sweepGhostFriends = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log("Connected to MongoDB for Ghost Sweep");

        // Find all friend requests
        const allRequests = await FriendRequest.find().populate('fromId').populate('toId');
        let ghostIds = [];

        for (const req of allRequests) {
            // If either fromId or toId failed to populate (user deleted)
            if (!req.fromId || !req.toId) {
                ghostIds.push(req._id);
            }
        }

        if (ghostIds.length > 0) {
            const deleteResult = await FriendRequest.deleteMany({ _id: { $in: ghostIds } });
            console.log(`Successfully swept ${deleteResult.deletedCount} ghost friend connections from deleted users (including the old admin)!`);
        } else {
            console.log("No ghost friend connections found. The database is clean!");
        }

    } catch (error) {
        console.error("Ghost sweep failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

sweepGhostFriends();
