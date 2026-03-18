import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function purgeLegacyMessages() {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/smart-sign-deck';
    console.log('Connecting to:', mongoUrl);

    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');

        const Message = mongoose.model('Message', new mongoose.Schema({
            text: String,
            senderId: mongoose.Schema.Types.ObjectId,
            recipientId: mongoose.Schema.Types.ObjectId,
        }, { strict: false }));

        const OLD_EMAIL = "smartsigndeck@gmail.com";

        // 1. Find and delete messages where the text IS the email
        const deletedEmailMsgs = await Message.deleteMany({
            text: { $regex: OLD_EMAIL, $options: 'i' }
        });
        console.log(`Deleted ${deletedEmailMsgs.deletedCount} messages containing "${OLD_EMAIL}"`);

        // 2. We already purged the User for this email in a previous script, 
        // but let's make sure no messages remain from any user that might have been the old admin.
        // (ID from previous logs was 698186430a37de04e58fc06f or similar)
        
        // 3. Optional: Delete any system messages that might be redundant
        const deletedSystemMsgs = await Message.deleteMany({
            text: "You are now connected with this user!"
        });
        console.log(`Deleted ${deletedSystemMsgs.deletedCount} system "connection" messages to clean up history.`);

        console.log('Purge complete.');
    } catch (error) {
        console.error('Error during purge:', error);
    } finally {
        await mongoose.disconnect();
    }
}

purgeLegacyMessages();
