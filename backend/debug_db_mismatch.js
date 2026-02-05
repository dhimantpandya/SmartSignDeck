const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    companyId: mongoose.Types.ObjectId,
    role: String
}, { strict: false });

const CompanySchema = new mongoose.Schema({
    name: String
}, { strict: false });

const PlaybackLogSchema = new mongoose.Schema({
    companyId: mongoose.Types.ObjectId,
    startTime: Date
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Company = mongoose.model('Company', CompanySchema);
const PlaybackLog = mongoose.model('PlaybackLog', PlaybackLogSchema);

const fs = require('fs');

async function checkMismatch() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL + '/' + process.env.MONGO_DB_NAME || 'mongodb://localhost:27017/smartsigndeck');
        let output = "Connected to MongoDB\n";

        const users = await User.find();
        output += "\n--- USERS ---\n";
        users.forEach(u => output += `User: ${u.name} (${u.email}) | ID: ${u._id} | CompanyID: ${u.companyId}\n`);

        const companies = await Company.find();
        output += "\n--- COMPANIES ---\n";
        companies.forEach(c => output += `Company: ${c.name} | ID: ${c._id}\n`);

        const logs = await PlaybackLog.find().limit(5);
        output += "\n--- LOGS (First 5) ---\n";
        logs.forEach(l => output += `LogID: ${l._id} | CompanyID: ${l.companyId} | Date: ${l.startTime}\n`);

        fs.writeFileSync('db_debug.log', output);
        console.log("Debug log written to db_debug.log");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkMismatch();
