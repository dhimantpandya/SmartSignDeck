const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function nuclearPurge() {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/smart-sign-deck';
    console.log('Connecting to:', mongoUrl);

    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');

        // Dynamically define models if they don't exist
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));
        const FriendRequest = mongoose.models.FriendRequest || mongoose.model('FriendRequest', new mongoose.Schema({}, { strict: false }));
        const Message = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({ text: String, senderId: mongoose.Schema.Types.ObjectId, recipientId: mongoose.Schema.Types.ObjectId }, { strict: false }));
        const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

        const OLD_EMAIL = "smartsigndeck@gmail.com";
        
        // Find ALL users matching the legacy email (case-insensitive)
        const oldAdmins = await User.find({ email: { $regex: new RegExp(`^${OLD_EMAIL}$`, 'i') } });
        console.log(`Found ${oldAdmins.length} matching legacy users.`);

        for (const admin of oldAdmins) {
            const adminId = admin._id;
            console.log(`Purging Admin ID: ${adminId} (${admin.email})`);

            const frResult = await FriendRequest.deleteMany({ $or: [{ fromId: adminId }, { toId: adminId }] });
            console.log(` - Deleted ${frResult.deletedCount} FriendRequests`);

            const msgResult = await Message.deleteMany({ $or: [{ senderId: adminId }, { recipientId: adminId }] });
            console.log(` - Deleted ${msgResult.deletedCount} Messages`);

            const notifResult = await Notification.deleteMany({ $or: [{ recipientId: adminId }, { senderId: adminId }] });
            console.log(` - Deleted ${notifResult.deletedCount} Notifications`);

            await User.deleteOne({ _id: adminId });
            console.log(` - Deleted User record.`);
        }

        console.log('Nuclear purge complete.');
    } catch (error) {
        console.error('Error during purge:', error);
    } finally {
        await mongoose.disconnect();
    }
}

nuclearPurge();
