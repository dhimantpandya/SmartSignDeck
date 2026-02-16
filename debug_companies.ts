
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

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
    await mongoose.connect(url, { dbName });

    const companies = await Company.find({});
    console.log('\n--- COMPANIES ---');
    companies.forEach(c => {
        console.log(`ID: ${c._id}, Name: "${c.name}", Email: ${c.email}`);
    });

    const users = await User.find({}).populate('companyId');
    console.log('\n--- USERS ---');
    users.forEach(u => {
        const cId = u.companyId ? (u.companyId as any)._id : 'null';
        const cName = u.companyId ? (u.companyId as any).name : 'null';
        console.log(`User: ${u.email}, CompanyID (Link): ${cId}, CompanyName (Link): "${cName}", CompanyName (String): "${u.companyName}"`);
    });

    await mongoose.disconnect();
}

debugCompanies().catch(console.error);
