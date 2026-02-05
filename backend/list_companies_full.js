
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const CompanySchema = new mongoose.Schema({
    name: String
});

const Company = mongoose.model('Company', CompanySchema);

async function listCompanies() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL;
        await mongoose.connect(mongoUrl, { dbName: process.env.MONGO_DB_NAME });

        const companies = await Company.find();
        console.log('--- COMPANIES_START ---');
        companies.forEach(c => {
            console.log(`FULL_ID: ${c._id}, NAME: ${c.name}`);
        });
        console.log('--- COMPANIES_END ---');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listCompanies();
