import mongoose from 'mongoose';
import User from './src/models/user.model';
import Template from './src/models/template.model';
import Screen from './src/models/screen.model';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
    console.log('Connected to MongoDB');

    const users = await User.find({ companyId: { $ne: null } });
    console.log(`Found ${users.length} users with companies`);

    for (const user of users) {
        const tRes = await Template.updateMany(
            { createdBy: user._id, companyId: { $ne: user.companyId } },
            { companyId: user.companyId }
        );
        const sRes = await Screen.updateMany(
            { createdBy: user._id, companyId: { $ne: user.companyId } },
            { companyId: user.companyId }
        );

        if (tRes.modifiedCount > 0 || sRes.modifiedCount > 0) {
            console.log(`Fixed for user ${user.email}: ${tRes.modifiedCount} templates, ${sRes.modifiedCount} screens`);
        }
    }

    console.log('Finished fixing company associations');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
