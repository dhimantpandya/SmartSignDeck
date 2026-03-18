const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function nuclearPurge() {
    // 🛡️ CRITICAL: Use MONGO_DB_URL as per the verified .env
    const mongoUrl = process.env.MONGO_DB_URL;
    
    if (!mongoUrl) {
        console.error('MONGO_DB_URL not found in .env!');
        process.exit(1);
    }
    
    console.log('Connecting to live Atlas DB...');

    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB Atlas');

        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));
        const FriendRequest = mongoose.models.FriendRequest || mongoose.model('FriendRequest', new mongoose.Schema({}, { strict: false }));
        const Message = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({ text: String, senderId: mongoose.Schema.Types.ObjectId, recipientId: mongoose.Schema.Types.ObjectId }, { strict: false }));
        const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

        const OLD_EMAIL = "smartsigndeck@gmail.com";
        
        // Find ALL users matching any variation of the legacy email
        const oldAdmins = await User.find({ email: { $regex: /smartsigndeck@gmail\.com/i } });
        console.log(`Found ${oldAdmins.length} matching legacy users.`);

        for (const admin of oldAdmins) {
            const adminId = admin._id;
            console.log(`Purging Admin ID: ${adminId} (${admin.email})`);

            // Delete FriendRequests
            const frResult = await FriendRequest.deleteMany({ $or: [{ fromId: adminId }, { toId: adminId }] });
            console.log(` - Deleted ${frResult.deletedCount} FriendRequests`);

            // Delete Messages
            const msgResult = await Message.deleteMany({ $or: [{ senderId: adminId }, { recipientId: adminId }] });
            console.log(` - Deleted ${msgResult.deletedCount} Messages`);

            // Delete Notifications
            const notifResult = await Notification.deleteMany({ $or: [{ recipientId: adminId }, { senderId: adminId }] });
            console.log(` - Deleted ${notifResult.deletedCount} Notifications`);

            // Delete User
            await User.deleteOne({ _id: adminId });
            console.log(` - Deleted User record.`);
        }

        // 🛡️ Extra check: Any orphaned FriendRequests for users that don't exist? (Optional but good)
        console.log('Nuclear purge complete.');
    } catch (error) {
        console.error('Error during purge:', error);
    } finally {
        await mongoose.disconnect();
    }
}

nuclearPurge();
