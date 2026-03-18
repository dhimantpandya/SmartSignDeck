import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function deleteLegacyAdmin() {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/smart-sign-deck';
    console.log('Connecting to:', mongoUrl);

    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));
        const FriendRequest = mongoose.model('FriendRequest', new mongoose.Schema({}, { strict: false }));
        const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
        const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

        const OLD_EMAIL = "smartsigndeck@gmail.com";

        // 1. Find the old user ID
        const oldAdmin = await User.findOne({ email: OLD_EMAIL });
        if (!oldAdmin) {
            console.log(`User with email ${OLD_EMAIL} not found. Already deleted?`);
        } else {
            const oldId = oldAdmin._id;
            console.log(`Found old admin with ID: ${oldId}`);

            // 2. Delete all friend requests involving this ID
            const delFR = await FriendRequest.deleteMany({
                $or: [{ fromId: oldId }, { toId: oldId }]
            });
            console.log(`Deleted ${delFR.deletedCount} friend requests.`);

            // 3. Delete all messages involving this ID (Safe because the user wants this ID GONE)
            const delMsg = await Message.deleteMany({
                $or: [{ senderId: oldId }, { recipientId: oldId }]
            });
            console.log(`Deleted ${delMsg.deletedCount} messages.`);

            // 4. Delete all notifications for this ID
            const delNotif = await Notification.deleteMany({ recipientId: oldId });
            console.log(`Deleted ${delNotif.deletedCount} notifications.`);

            // 5. Delete the user
            await User.deleteOne({ _id: oldId });
            console.log(`Deleted user account: ${OLD_EMAIL}`);
        }

        console.log('Cleanup complete.');
    } catch (error) {
        console.error('Error during deletion:', error);
    } finally {
        await mongoose.disconnect();
    }
}

deleteLegacyAdmin();
