
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const CompanySchema = new mongoose.Schema({
    name: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Company = mongoose.model('Company', CompanySchema);

async function findTechnostacksUsers() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
        const mongoDbName = process.env.MONGO_DB_NAME || 'smartsigndeck';
        await mongoose.connect(`${mongoUrl}/${mongoDbName}`);

        console.log('Finding all "Technostacks" companies...');
        const companies = await Company.find({ name: /Technostacks/i });
        const ids = companies.map(c => c._id);
        const names = companies.map(c => c.name);

        console.log('Found Company IDs:', ids);
        console.log('Found Company Names:', names);

        const users = await User.find({
            $or: [
                { companyId: { $in: ids } },
                { companyName: { $in: names } },
                { companyName: /Technostacks/i }
            ]
        });

        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ${u.email} | companyId: ${u.companyId} | companyName: ${u.companyName}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

findTechnostacksUsers();
