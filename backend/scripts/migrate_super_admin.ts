import mongoose from "mongoose";
import User from "../src/models/user.model";
import Company from "../src/models/company.model";
import Screen from "../src/models/screen.model";
import Template from "../src/models/template.model";
import Playlist from "../src/models/playlist.model";
import { Notification } from "../src/models/notification.model"; // Correct named import
import { FriendRequest, Message } from "../src/models/social.model";
import Token from "../src/models/token.model";
import config from "../src/config/config";

const migrateSuperAdmin = async () => {
    const OLD_EMAIL = "smartsigndeck@gmail.com";
    const NEW_EMAIL = "smartsigndeckk@gmail.com";

    try {
        console.log(`Connecting to: ${config.mongoose.url}`);
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        console.log("Connected to MongoDB via Migration Script");

        // 1. Find Old Super Admin
        const oldAdmin = await User.findOne({ email: OLD_EMAIL });
        if (!oldAdmin) {
            console.error(`Source user ${OLD_EMAIL} not found. Migration aborted.`);
            return;
        }
        const oldId = oldAdmin._id;
        console.log(`Found Source Admin: ${OLD_EMAIL} (ID: ${oldId})`);

        // 2. Find or Create New Super Admin
        let newAdmin = await User.findOne({ email: NEW_EMAIL });
        if (!newAdmin) {
            console.log(`New user ${NEW_EMAIL} not found. Creating from source...`);
            newAdmin = await User.create({
                first_name: oldAdmin.first_name,
                last_name: oldAdmin.last_name,
                email: NEW_EMAIL,
                password: oldAdmin.password, // Keep same hashed password
                role: "super_admin",
                is_email_verified: true,
                onboardingCompleted: true,
                companyId: oldAdmin.companyId,
                companyName: oldAdmin.companyName,
                authProvider: "local"
            });
            console.log(`Created new Super Admin: ${NEW_EMAIL}`);
        } else {
            console.log(`Target account ${NEW_EMAIL} already exists. Promoting to super_admin...`);
            newAdmin.role = "super_admin";
            newAdmin.is_email_verified = true;
            await newAdmin.save();
        }
        const newId = newAdmin._id;

        console.log(`\n--- STARTING DATA TRANSFER: ${oldId} -> ${newId} ---\n`);

        // 3. Update Companies (ownerId)
        const companyUpdate = await Company.updateMany({ ownerId: oldId }, { $set: { ownerId: newId } });
        console.log(`Updated Companies: ${companyUpdate.modifiedCount}`);

        // 4. Update Screens (createdBy)
        const screenUpdate = await Screen.updateMany({ createdBy: oldId }, { $set: { createdBy: newId } });
        console.log(`Updated Screens: ${screenUpdate.modifiedCount}`);

        // 5. Update Templates (createdBy)
        const templateUpdate = await Template.updateMany({ createdBy: oldId }, { $set: { createdBy: newId } });
        console.log(`Updated Templates: ${templateUpdate.modifiedCount}`);

        // 6. Update Playlists (createdBy)
        const playlistUpdate = await Playlist.updateMany({ createdBy: oldId }, { $set: { createdBy: newId } });
        console.log(`Updated Playlists: ${playlistUpdate.modifiedCount}`);

        // 7. Update Notifications (recipientId/senderId)
        const notifRecipientUpdate = await Notification.updateMany({ recipientId: oldId }, { $set: { recipientId: newId } });
        const notifSenderUpdate = await Notification.updateMany({ senderId: oldId }, { $set: { senderId: newId } });
        console.log(`Updated Notifications: Recipient=${notifRecipientUpdate.modifiedCount}, Sender=${notifSenderUpdate.modifiedCount}`);

        // 8. Update Social Connections (fromId/toId) and Messages (senderId/recipientId)
        const socialFromUpdate = await FriendRequest.updateMany({ fromId: oldId }, { $set: { fromId: newId } });
        const socialToUpdate = await FriendRequest.updateMany({ toId: oldId }, { $set: { toId: newId } });
        const messageSenderUpdate = await Message.updateMany({ senderId: oldId }, { $set: { senderId: newId } });
        const messageRecipientUpdate = await Message.updateMany({ recipientId: oldId }, { $set: { recipientId: newId } });
        console.log(`Updated Social/Chat: FriendRequests=${socialFromUpdate.modifiedCount + socialToUpdate.modifiedCount}, Messages=${messageSenderUpdate.modifiedCount + messageRecipientUpdate.modifiedCount}`);

        // 9. Update Tokens (user)
        const tokenUpdate = await Token.updateMany({ user: oldId }, { $set: { user: newId } });
        console.log(`Updated Tokens: ${tokenUpdate.modifiedCount}`);

        // 10. Deprioritize Old Account
        oldAdmin.email = `smartsigndeck_old_${Date.now()}@gmail.com`;
        oldAdmin.role = "user"; // Standard user
        await oldAdmin.save();
        console.log(`\nOld account renamed and role changed to 'user'.`);

        console.log(`\n✅ MIGRATION SUCCESSFUL!`);
        console.log(`New Login Email: ${NEW_EMAIL}`);
        console.log(`Please run 'npm run dev' to restart the application services.`);
        process.exit(0);

    } catch (error) {
        console.error("Migration failed with error:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

migrateSuperAdmin();
