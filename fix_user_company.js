
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId,
    role: String,
    onboardingCompleted: Boolean
}, { strict: false });

const CompanySchema = new mongoose.Schema({
    name: String,
    ownerId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Company = mongoose.model('Company', CompanySchema);

async function runUpdate() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const targetEmail = 'dhimantpandya6@gmail.com';
        const newCompanyName = 'Technostacks';

        const user = await User.findOne({ email: targetEmail });
        if (!user) {
            console.log(`User ${targetEmail} not found`);
            await mongoose.disconnect();
            return;
        }

        console.log(`Found user: ${user.email}, Role: ${user.role}, current Company: ${user.companyName}`);

        // 1. Update Company if it exists
        let companyId = user.companyId;
        if (companyId) {
            const company = await Company.findById(companyId);
            if (company) {
                console.log(`Updating existing Company (ID: ${companyId}) name from "${company.name}" to "${newCompanyName}"`);
                company.name = newCompanyName;
                await company.save();
            } else {
                console.log(`Company ID ${companyId} linked to user not found in Companies collection.`);
                companyId = null;
            }
        }

        // 2. If no companyId or company not found, try to find company by name
        if (!companyId) {
            let company = await Company.findOne({ name: newCompanyName });
            if (company) {
                console.log(`Found existing Company "${newCompanyName}" (ID: ${company._id}), linking user.`);
                companyId = company._id;
            } else {
                console.log(`Creating new Company "${newCompanyName}"`);
                company = await Company.create({
                    name: newCompanyName,
                    ownerId: user._id,
                    isActive: true
                });
                companyId = company._id;
            }
        }

        // 3. Update User
        user.companyName = newCompanyName;
        user.companyId = companyId;
        user.onboardingCompleted = true;
        await user.save();

        console.log(`User ${targetEmail} updated with company name "${newCompanyName}" and companyId "${companyId}"`);

        await mongoose.disconnect();
        console.log('Done.');
    } catch (error) {
        console.error('Error:', error);
    }
}

runUpdate();
