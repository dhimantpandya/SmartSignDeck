const mongoose = require('mongoose');

async function findActiveUser() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Company = mongoose.model('Company', new mongoose.Schema({}, { strict: false }));

        const users = await User.find({}).sort({ updatedAt: -1 });
        console.log('--- USERS BY RECENT ACTIVITY ---');
        for (const u of users) {
            const company = await Company.findById(u.companyId);
            console.log(`Email: ${u.email}`);
            console.log(`   ID: ${u._id}`);
            console.log(`   Company: ${company ? company.name : 'Unknown'} (${u.companyId})`);
            console.log(`   Avatar: ${u.avatar ? 'YES' : 'NO'}`);
            console.log(`   Role: ${u.role}`);
            console.log(`   Updated: ${u.updatedAt}`);
            console.log('-------------------');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findActiveUser();
