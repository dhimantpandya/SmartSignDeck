const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.MONGO_DB_URL;
const dbName = process.env.MONGO_DB_NAME || 'smartsigndeck';

async function finalAtlasPurge() {
    console.log(`Connecting to: ${dbUrl} / DB: ${dbName}`);
    try {
        await mongoose.connect(dbUrl, { dbName });
        console.log('Connected!');

        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));
        const FriendRequest = mongoose.models.FriendRequest || mongoose.model('FriendRequest', new mongoose.Schema({}, { strict: false }));
        const Message = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({ text: String, senderId: mongoose.Schema.Types.ObjectId, recipientId: mongoose.Schema.Types.ObjectId }, { strict: false }));
        const Notification = mongoose.models.Notification || mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

        const OLD_EMAIL = "smartsigndeck@gmail.com";
        const oldAdmins = await User.find({ email: { $regex: new RegExp(`^${OLD_EMAIL}$`, 'i') } });
        console.log(`Found ${oldAdmins.length} users with email ${OLD_EMAIL}`);

        for (const admin of oldAdmins) {
            const adminId = admin._id;
            console.log(`Purging ID: ${adminId}`);

            const fr = await FriendRequest.deleteMany({ $or: [{ fromId: adminId }, { toId: adminId }] });
            console.log(` - Deleted ${fr.deletedCount} FriendRequests`);

            const msg = await Message.deleteMany({ $or: [{ senderId: adminId }, { recipientId: adminId }] });
            console.log(` - Deleted ${msg.deletedCount} Messages`);

            const n = await Notification.deleteMany({ $or: [{ recipientId: adminId }, { senderId: adminId }] });
            console.log(` - Deleted ${n.deletedCount} Notifications`);

            await User.deleteOne({ _id: adminId });
            console.log(' - Deleted User.');
        }

        console.log('Cleanup complete on Atlas.');
    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        await mongoose.disconnect();
    }
}

finalAtlasPurge();
