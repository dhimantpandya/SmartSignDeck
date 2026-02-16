
const path = require('path');
// Try to require mongoose from backend node_modules
let mongoose;
try {
    mongoose = require('./backend/node_modules/mongoose');
} catch (e) {
    try {
        mongoose = require('mongoose');
    } catch (e2) {
        console.error('Cannot find mongoose.');
        process.exit(1);
    }
}

// Minimal Schemas
const companySchema = new mongoose.Schema({ name: String }, { timestamps: true });
const userSchema = new mongoose.Schema({ email: String, companyId: mongoose.Schema.Types.ObjectId, companyName: String });
const messageSchema = new mongoose.Schema({ text: String, companyId: mongoose.Schema.Types.ObjectId, senderId: mongoose.Schema.Types.ObjectId }, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

async function debugChatState() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'smartsigndeck';

    console.log(`Connecting to ${url} / ${dbName}...`);
    await mongoose.connect(url, { dbName });

    console.log('\n--- COMPANIES (Technostacks) ---');
    const companies = await Company.find({ name: { $regex: /technostacks/i } });
    companies.forEach(c => console.log(`Company ID: ${c._id}, Name: ${c.name}`));

    if (companies.length === 0) { console.log('No Technostacks company found!'); }

    const targetCompanyId = companies[0]?._id;

    console.log('\n--- USERS (Dhimant) ---');
    const users = await User.find({ email: { $regex: /dhimant/i } });
    users.forEach(u => {
        console.log(`User: ${u.email}, CompanyID: ${u.companyId}, CompanyName: ${u.companyName}`);
        if (targetCompanyId && u.companyId && u.companyId.toString() !== targetCompanyId.toString()) {
            console.warn(`⚠️ MISMATCH: User ${u.email} has companyId ${u.companyId}, expected ${targetCompanyId}`);
        }
    });

    console.log('\n--- RECENT MESSAGES ---');
    const messages = await Message.find({}).sort({ createdAt: -1 }).limit(10);
    for (const m of messages) {
        console.log(`Msg: "${m.text}", CompanyID: ${m.companyId}, Sender: ${m.senderId}`);
        if (targetCompanyId && m.companyId && m.companyId.toString() !== targetCompanyId.toString()) {
            console.warn(`⚠️ MISMATCH: Message ${m._id} has companyId ${m.companyId}, expected ${targetCompanyId}`);
        }
    }

    await mongoose.disconnect();
}

debugChatState();
