
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const CompanySchema = new mongoose.Schema({
    name: String,
    ownerId: mongoose.Schema.Types.ObjectId
});

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId,
    onboardingCompleted: Boolean
});

const Company = mongoose.model('Company', CompanySchema);
const User = mongoose.model('User', UserSchema);

async function checkData() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL;
        await mongoose.connect(mongoUrl, { dbName: process.env.MONGO_DB_NAME });

        console.log('--- Companies ---');
        const companies = await Company.find();
        console.log(JSON.stringify(companies, null, 2));

        console.log('\n--- Users with dhimant ---');
        const users = await User.find({ email: /dhimant/i });
        console.log(JSON.stringify(users, null, 2));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkData();
