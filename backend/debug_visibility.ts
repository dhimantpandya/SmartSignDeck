import mongoose from 'mongoose';
import User from './src/models/user.model';
import Company from './src/models/company.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function debugGetUsers() {
    const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017/smartsigndeck';
    console.log('Connecting to:', mongoUrl);
    await mongoose.connect(mongoUrl);
    console.log('Connected.');

    const PREDEFINED_EMAIL = "smartsigndeck@gmail.com";

    // Simulate a regular user fetching their organization list
    const testEmail = "dhimantpandya6@gmail.com";
    const user = await User.findOne({ email: testEmail });
    if (!user) {
        console.log('User not found:', testEmail);
        process.exit(1);
    }

    console.log('Found user:', user.email, 'CompanyId:', user.companyId);

    const filter: any = { companyId: user.companyId?.toString() };

    // Exact logic from controller
    if (filter.companyId) {
        const companyId = filter.companyId;
        const company = await Company.findById(companyId);
        if (company) {
            const relatedCompanies = await Company.find({
                name: { $regex: new RegExp(`^${company.name}$`, "i") }
            });
            const companyIds = relatedCompanies.map(c => c._id);
            const companyNames = relatedCompanies.map(c => c.name);

            filter.$or = [
                { email: PREDEFINED_EMAIL },
                { companyId: { $in: companyIds } },
                { companyName: { $in: companyNames } },
                { companyName: { $regex: new RegExp(`^${company.name}$`, "i") } }
            ];
        } else {
            filter.$or = [
                { email: PREDEFINED_EMAIL },
                { companyId: companyId },
                { companyName: companyId }
            ];
        }
        delete filter.companyId;
    }

    console.log('Generated filter:', JSON.stringify(filter, null, 2));

    const results = await User.find(filter).populate('companyId');
    console.log('Results count:', results.length);
    results.forEach(r => console.log(' - ', r.email, '(', r.first_name, ')'));

    // Check if smartsigndeck exists at all
    const admin = await User.findOne({ email: PREDEFINED_EMAIL });
    console.log('Predefined user exists in DB?', !!admin);
    if (admin) {
        // If it exists but not in results, why?
        // Match it against the filter manually
        const emailMatch = admin.email === PREDEFINED_EMAIL;
        console.log('Admin email matches PREDEFINED_EMAIL?', emailMatch);
    }

    await mongoose.disconnect();
}

debugGetUsers().catch(console.error);
