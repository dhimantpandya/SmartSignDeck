
const path = require('path');
let mongoose;
try {
    mongoose = require('./backend/node_modules/mongoose');
} catch (e) {
    mongoose = require('mongoose');
}

const companySchema = new mongoose.Schema({ name: String }, { timestamps: true });
const userSchema = new mongoose.Schema({
    email: String,
    first_name: String,
    last_name: String,
    companyId: mongoose.Schema.Types.ObjectId,
    companyName: String
});

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);

const fs = require('fs');
const logStream = fs.createWriteStream('audit_results.log');

function log(msg) {
    console.log(msg);
    logStream.write(msg + '\n');
}

async function audit() {
    const url = 'mongodb://localhost:27017/smartsigndeck';
    log('Connecting...');
    await mongoose.connect(url);

    log('\n=== ALL COMPANIES ===');
    const companies = await Company.find({});
    const companyMap = {};
    companies.forEach(c => {
        log(`[${c._id}] "${c.name}"`);
        companyMap[c._id.toString()] = c.name;
    });

    log('\n=== ALL USERS ===');
    const users = await User.find({});
    users.forEach(u => {
        const cId = u.companyId ? u.companyId.toString() : 'null';
        const cNameRef = companyMap[cId] || 'UNKNOWN_COMPANY_ID';
        log(`User: ${u.email} (${u.first_name} ${u.last_name})`);
        log(`   -> Company ID in DB: ${cId}`);
        log(`   -> Company Name in DB: "${u.companyName}"`);
        log(`   -> Resolved Company: "${cNameRef}"`);
        log('---');
    });

    await mongoose.disconnect();
    logStream.end();
}

audit().catch(console.error);
