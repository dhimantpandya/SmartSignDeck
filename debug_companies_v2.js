
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const companySchema = new mongoose.Schema({
    name: String,
    email: String
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: String
});

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);

async function debugCompanies() {
    const url = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
    const dbName = process.env.MONGO_DB_NAME || 'smartsigndeck';

    console.log(`Connecting to ${url} / ${dbName}...`);
    try {
        await mongoose.connect(url, { dbName });
        console.log('Connected.');

        const companies = await Company.find({});
        console.log('\n--- COMPANIES ---');
        if (companies.length === 0) console.log('No companies found.');
        companies.forEach(c => {
            console.log(`ID: ${c._id}, Name: "${c.name}", Email: ${c.email}`);
        });

        const users = await User.find({}).populate('companyId');
        console.log('\n--- USERS ---');
        if (users.length === 0) console.log('No users found.');
        users.forEach(u => {
            const cId = u.companyId ? u.companyId._id : 'null';
            const cName = u.companyId ? u.companyId.name : 'null';
            console.log(`User: ${u.email}, Role: ${u.role || 'unknown'}, CompanyID (Link): ${cId}, CompanyName (Link): "${cName}", CompanyName (String): "${u.companyName}"`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

debugCompanies();
