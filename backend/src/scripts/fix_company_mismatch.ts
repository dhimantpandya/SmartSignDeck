
import mongoose from 'mongoose';
import config from '../config/config';
import User from '../models/user.model';
import Company from '../models/company.model';

const TARGET_COMPANY_ID = '698f1a5fab433f60971ed4e7'; // User A's Company (Technostacks Team)
const USER_EMAIL = 'dhimantpandya6@gmail.com'; // User B (The one with the wrong ID)

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        console.log(`Connected to ${config.mongoose.url}`);

        // 1. Find User B
        const user = await User.findOne({ email: USER_EMAIL.toLowerCase() });
        if (!user) {
            console.error(`❌ User ${USER_EMAIL} not found!`);
            process.exit(1);
        }

        console.log(`\nFound User: ${user.email} (${user.first_name} ${user.last_name})`);
        console.log(`Current Company ID: ${user.companyId}`);
        console.log(`Current Company Name: ${user.companyName}`);

        // 2. Find Target Company to confirm it exists
        const targetCompany = await Company.findById(TARGET_COMPANY_ID);
        if (!targetCompany) {
            console.error(`❌ Target Company ${TARGET_COMPANY_ID} not found!`);
            process.exit(1);
        }
        console.log(`\nTarget Company Found: "${targetCompany.name}" (${targetCompany._id})`);

        // 3. Update User
        console.log(`\nMoving user to correct company...`);
        user.companyId = targetCompany._id;
        user.companyName = targetCompany.name;

        // Also ensure company is active
        if (!targetCompany.isActive) {
            console.log('Activating target company...');
            targetCompany.isActive = true;
            await targetCompany.save();
        }

        await user.save();

        console.log('✅ User updated successfully!');
        console.log(`User ${user.email} is now a member of ${targetCompany.name} (${user.companyId})`);
        console.log('\nPlease refresh the browser for User B to see changes.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
