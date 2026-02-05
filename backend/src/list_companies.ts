
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const CompanySchema = new mongoose.Schema({
    name: String
}, { strict: false });

const Company = mongoose.model('Company', CompanySchema);

async function listCompanies() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
        const mongoDbName = process.env.MONGO_DB_NAME || 'smartsigndeck';
        await mongoose.connect(`${mongoUrl}/${mongoDbName}`);

        const companies = await Company.find({});
        console.log(`Found ${companies.length} companies.`);
        companies.forEach(c => console.log(`- ${c.name} (${c._id})`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listCompanies();
