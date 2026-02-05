const mongoose = require('mongoose');

async function unifyOwnership() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));

        // Current active user
        const targetUser = await User.findOne({ email: 'dhimant.pandya@technostacks.in' });
        if (!targetUser) {
            console.error('Target user dhimant.pandya@technostacks.in not found');
            process.exit(1);
        }

        const userId = targetUser._id;
        const companyId = targetUser.companyId;

        console.log(`Unifying all screens in company ${companyId} to user ${targetUser.email} (${userId})`);

        const result = await Screen.updateMany(
            { companyId: companyId },
            { $set: { createdBy: userId, deletedAt: null } }
        );

        console.log(`Success! Updated ${result.modifiedCount} screens.`);

        // List them to be sure
        const updatedScreens = await Screen.find({ companyId: companyId });
        console.log('\nCurrent screens for you:');
        updatedScreens.forEach(s => console.log(`- ${s.name} (${s._id})`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

unifyOwnership();
