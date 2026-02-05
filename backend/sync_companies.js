
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId,
    onboardingCompleted: Boolean
});

const User = mongoose.model('User', UserSchema);

async function synchronizeCompanies() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL;
        await mongoose.connect(mongoUrl, { dbName: process.env.MONGO_DB_NAME });
        console.log('Connected to MongoDB');

        // 1. Find the "Technostacks" user to get the correct companyId
        const sourceUser = await User.findOne({ email: 'dhimant.panya@technostacks.in' });
        // Wait, let's search by companyName Technostacks to be safer
        const technostacksUser = await User.findOne({ companyName: 'Technostacks' });

        if (!technostacksUser || !technostacksUser.companyId) {
            console.error('Could not find a user with Technostacks companyId');
            // Fallback: search for any user with the correct email domain or similar
            const anyTechno = await User.findOne({ email: /technostacks/i });
            if (!anyTechno || !anyTechno.companyId) {
                process.exit(1);
            }
            technostacksUser = anyTechno;
        }

        const correctCompanyId = technostacksUser.companyId;
        console.log(`Found Technostacks Company ID: ${correctCompanyId}`);

        // 2. Update the other user
        const targetEmail = 'dhimantpandya6@gmail.com';
        const result = await User.findOneAndUpdate(
            { email: targetEmail },
            {
                companyId: correctCompanyId,
                companyName: 'Technostacks',
                onboardingCompleted: true
            },
            { new: true }
        );

        if (result) {
            console.log(`Successfully updated ${targetEmail} to Technostacks (ID: ${correctCompanyId})`);
        } else {
            console.log(`User ${targetEmail} not found`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

synchronizeCompanies();
