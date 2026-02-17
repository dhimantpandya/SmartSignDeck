import mongoose from 'mongoose';
import User from './src/models/user.model';
import Template from './src/models/template.model';
import Screen from './src/models/screen.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/smartsigndeck';

async function repairData() {
    console.log('Connecting to:', MONGODB_URL);
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Analyzing ${users.length} users...`);

    for (const user of users) {
        if (!user.companyId) {
            console.log(`User ${user.email} has no companyId. Skipping.`);
            continue;
        }

        // Fix Templates
        const tResult = await Template.updateMany(
            { createdBy: user._id, companyId: { $exists: false } },
            { companyId: user.companyId }
        );
        const tResult2 = await Template.updateMany(
            { createdBy: user._id, companyId: null },
            { companyId: user.companyId }
        );

        // Fix Screens
        const sResult = await Screen.updateMany(
            { createdBy: user._id, companyId: { $exists: false } },
            { companyId: user.companyId }
        );
        const sResult2 = await Screen.updateMany(
            { createdBy: user._id, companyId: null },
            { companyId: user.companyId }
        );

        const totalT = tResult.modifiedCount + tResult2.modifiedCount;
        const totalS = sResult.modifiedCount + sResult2.modifiedCount;

        if (totalT > 0 || totalS > 0) {
            console.log(`[FIXED] User ${user.email}: ${totalT} templates, ${totalS} screens assigned to company ${user.companyId}`);
        }
    }

    console.log('Data repair complete.');
    process.exit(0);
}

repairData().catch(err => {
    console.error('Repair failed:', err);
    process.exit(1);
});
