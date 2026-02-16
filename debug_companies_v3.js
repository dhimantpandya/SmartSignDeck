
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

const companySchema = new mongoose.Schema({
    name: String,
    email: String,
    ownerId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: String,
    role: String
});

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);

async function debugCompanies() {
    // Hardcoded for simplicity/reliability in this debug script
    const url = 'mongodb://localhost:27017';
    const dbName = 'smartsigndeck';

    console.log(`Connecting to ${url} / ${dbName}...`);
    try {
        await mongoose.connect(url, { dbName });
        console.log('Connected.');

        const companies = await Company.find({});
        console.log('\n--- COMPANIES ---');
        if (companies.length === 0) console.log('No companies found.');
        companies.forEach(c => {
            console.log(`ID: ${c._id}, Name: "${c.name}", Owner: ${c.ownerId}`);
        });

        const users = await User.find({}).populate('companyId');
        console.log('\n--- USERS ---');
        if (users.length === 0) console.log('No users found.');
        users.forEach(u => {
            const cId = u.companyId ? u.companyId._id : 'null';
            const cName = u.companyId ? u.companyId.name : 'null';
            console.log(`User: ${u.email}, Role: ${u.role}, CompanyID (Link): ${cId}, CompanyName (Link): "${cName}", CompanyName (String): "${u.companyName}"`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

debugCompanies();
