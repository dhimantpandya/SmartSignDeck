const mongoose = require('mongoose');

async function checkFinalCount() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));

        const user = await User.findOne({ email: 'dhimant.pandya@technostacks.in' });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        const screens = await Screen.find({ createdBy: user._id });
        console.log(`--- FINAL COUNT FOR ${user.email} ---`);
        console.log(`TOTAL VISIBLE SCREENS: ${screens.length}`);
        screens.forEach(s => console.log(`- ${s.name} (${s._id})`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkFinalCount();
