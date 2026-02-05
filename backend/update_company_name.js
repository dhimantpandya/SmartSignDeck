
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    onboardingCompleted: Boolean
});

const User = mongoose.model('User', UserSchema);

async function updateCompanyName() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL;
        if (!mongoUrl) {
            console.error('MONGO_DB_URL not found in environment');
            process.exit(1);
        }

        await mongoose.connect(mongoUrl, { dbName: process.env.MONGO_DB_NAME });
        console.log('Connected to MongoDB');

        const email = 'dhimantpandya6@gmail.com';
        const result = await User.findOneAndUpdate(
            { email },
            { companyName: 'Technostacks', onboardingCompleted: true },
            { new: true }
        );

        if (result) {
            console.log(`Successfully updated company name for ${email} to ${result.companyName}`);
        } else {
            console.log(`User ${email} not found`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error updating company name:', error);
        process.exit(1);
    }
}

updateCompanyName();
