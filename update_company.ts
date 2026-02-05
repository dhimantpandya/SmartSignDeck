
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    onboardingCompleted: Boolean
});

const User = mongoose.model('User', UserSchema);

async function updateCompanyName() {
    try {
        await mongoose.connect(process.env.MONGODB_URL!);
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
    } catch (error) {
        console.error('Error updating company name:', error);
    }
}

updateCompanyName();
