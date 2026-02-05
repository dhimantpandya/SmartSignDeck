const mongoose = require('mongoose');

async function listScreens() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const screens = await Screen.find({}).sort({ created_at: -1 });
        console.log(`TOTAL SCREENS IN DB: ${screens.length}`);

        for (const s of screens) {
            const user = await User.findById(s.createdBy);
            console.log(`Name: "${s.name}" | ID: ${s._id}`);
            console.log(`   Owner: ${user ? user.email : 'NOT FOUND'} (${s.createdBy})`);
            console.log(`   Company: ${s.companyId}`);
            console.log(`   Public: ${s.isPublic}`);
            console.log(`   DeletedAt: ${s.deletedAt}`);
            console.log('-----------------------------------');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listScreens();
