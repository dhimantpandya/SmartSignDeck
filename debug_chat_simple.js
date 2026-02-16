
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

// Minimal Schemas
const companySchema = new mongoose.Schema({ name: String }, { timestamps: true });
const userSchema = new mongoose.Schema({ email: String, companyId: mongoose.Schema.Types.ObjectId, companyName: String });
const messageSchema = new mongoose.Schema({ text: String, companyId: mongoose.Schema.Types.ObjectId, senderId: mongoose.Schema.Types.ObjectId }, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

async function debugChatState() {
    const url = 'mongodb://localhost:27017/smartsigndeck';
    console.log('Connecting...');
    await mongoose.connect(url);

    console.log('\n--- COMPANIES ---');
    const companies = await Company.find({ name: { $regex: /technostacks/i } });
    companies.forEach(c => console.log(`C_ID: ${c._id}`));

    if (companies.length === 0) { console.log('No Technostacks found!'); process.exit(1); }
    const targetId = companies[0]._id.toString();

    console.log('\n--- USERS ---');
    const users = await User.find({ email: { $regex: /dhimant/i } });
    users.forEach(u => {
        const uCId = u.companyId ? u.companyId.toString() : 'null';
        const match = uCId === targetId ? '✅' : '❌';
        console.log(`User: ${u.email} | CID: ${uCId} | Match: ${match}`);
    });

    console.log('\n--- MESSAGES ---');
    const messages = await Message.find({}).sort({ createdAt: -1 }).limit(5);
    messages.forEach(m => {
        const mCId = m.companyId ? m.companyId.toString() : 'null';
        const match = mCId === targetId ? '✅' : '❌';
        console.log(`Msg: ${m.text.substring(0, 20)}... | CID: ${mCId} | Match: ${match}`);
    });

    await mongoose.disconnect();
}

debugChatState().catch(console.error);
