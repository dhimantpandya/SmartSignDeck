const mongoose = require('mongoose');

async function listAllScreens() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Company = mongoose.model('Company', new mongoose.Schema({}, { strict: false }));

        const screens = await Screen.find({});
        console.log(`TOTAL SCREENS IN DB: ${screens.length}`);

        for (const s of screens) {
            const user = await User.findById(s.createdBy);
            const company = await Company.findById(s.companyId);
            console.log(`-----------------------------------`);
            console.log(`Name: "${s.name}"`);
            console.log(`ID: ${s._id}`);
            console.log(`Owner: ${user ? user.email : 'NOT FOUND'} (${s.createdBy})`);
            console.log(`Company: ${company ? company.name : 'NOT FOUND'} (${s.companyId})`);
            console.log(`Public: ${s.isPublic}`);
            console.log(`Status: ${s.status}`);
            console.log(`DeletedAt: ${s.deletedAt}`);
            console.log(`CreatedAt: ${s.created_at || s.createdAt}`);
        }

        const users = await User.find({});
        console.log(`\nTOTAL USERS: ${users.length}`);
        users.forEach(u => console.log(`User: ${u.email} | ID: ${u._id} | Company: ${u.companyId}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAllScreens();
