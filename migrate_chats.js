
const path = require('path');
// Try to require mongoose from backend node_modules
let mongoose;
try {
    mongoose = require('./backend/node_modules/mongoose');
} catch (e) {
    try {
        mongoose = require('mongoose');
    } catch (e2) {
        console.error('Cannot find mongoose. Please run from root or install mongoose.');
        process.exit(1);
    }
}

// Define minimal schemas
const companySchema = new mongoose.Schema({
    name: String,
    email: String,
    ownerId: mongoose.Schema.Types.ObjectId,
    isActive: Boolean
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    text: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
const Message = mongoose.model('Message', messageSchema);

async function migrateChats() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'smartsigndeck';

    console.log(`Connecting to ${url} / ${dbName}...`);
    await mongoose.connect(url, { dbName });
    console.log('Connected.');

    // 1. Find the master "technostacks" company
    // We look for any company named "technostacks" (should be only 1 now)
    const masterCompany = await Company.findOne({
        name: { $regex: /^technostacks$/i }
    });

    if (!masterCompany) {
        console.error('Master company "technostacks" not found!');
        process.exit(1);
    }

    console.log(`Master Company Found: ${masterCompany._id} (${masterCompany.name})`);

    // 2. Find messages that have a companyId BUT that companyId no longer exists
    // OR just find all messages from users in this company and update them?
    // Better approach: Find all messages where companyId is NOT the master, but the sender IS in the master company.
    // Actually, simplest is:
    // If we merged companies, the old IDs are GONE from the Company collection.
    // So any Message pointing to a non-existent Company ID needs to be moved.

    const allMessages = await Message.find({ companyId: { $ne: null } });
    console.log(`Scanning ${allMessages.length} company messages...`);

    let movedCount = 0;
    for (const msg of allMessages) {
        // Check if the company exists
        const companyExists = await Company.findById(msg.companyId);

        if (!companyExists) {
            console.log(`Message ${msg._id} points to missing company ${msg.companyId}. Moving to Master...`);
            msg.companyId = masterCompany._id;
            await msg.save();
            movedCount++;
        } else if (companyExists.name.toLowerCase().trim() === 'technostacks' && companyExists._id.toString() !== masterCompany._id.toString()) {
            // This case shouldn't happen if we deleted duplicates, but good to check
            console.log(`Message ${msg._id} points to duplicate technostacks ${msg.companyId}. Moving...`);
            msg.companyId = masterCompany._id;
            await msg.save();
            movedCount++;
        }
    }

    console.log(`Migrated ${movedCount} messages to ${masterCompany.name} (${masterCompany._id}).`);

    await mongoose.disconnect();
    console.log('Done.');
}

migrateChats().catch(err => {
    console.error(err);
    process.exit(1);
});
