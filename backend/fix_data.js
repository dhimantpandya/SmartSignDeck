const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    email: String,
    companyId: mongoose.Types.ObjectId,
}, { strict: false });

const PlaybackLogSchema = new mongoose.Schema({
    companyId: mongoose.Types.ObjectId,
}, { strict: false });

const ScreenSchema = new mongoose.Schema({
    companyId: mongoose.Types.ObjectId,
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const PlaybackLog = mongoose.model('PlaybackLog', PlaybackLogSchema);
const Screen = mongoose.model('Screen', ScreenSchema);

async function fixData() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL + '/' + process.env.MONGO_DB_NAME || 'mongodb://localhost:27017/smartsigndeck');
        console.log("Connected to MongoDB for FIX");

        // 1. Find the main user (first user found)
        const user = await User.findOne();
        if (!user) {
            console.log("No user found!");
            return;
        }

        const targetCompanyId = user.companyId;
        console.log(`Targeting Company ID from User (${user.email}): ${targetCompanyId}`);

        // 2. Update Screens
        const screenUpdate = await Screen.updateMany({}, { $set: { companyId: targetCompanyId } });
        console.log(`Updated ${screenUpdate.modifiedCount} Screens.`);

        // 3. Update Logs
        const logUpdate = await PlaybackLog.updateMany({}, { $set: { companyId: targetCompanyId } });
        console.log(`Updated ${logUpdate.modifiedCount} PlaybackLogs.`);

    } catch (error) {
        console.error("Error fixing data:", error);
    } finally {
        await mongoose.disconnect();
    }
}

fixData();
