const mongoose = require('mongoose');
const crypto = require('crypto');

async function fixScreens() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));

        const screens = await Screen.find({ secretKey: { $exists: false } });
        console.log(`Found ${screens.length} screens missing secretKey`);

        for (const s of screens) {
            s.set('secretKey', crypto.randomBytes(16).toString('hex'));
            await s.save();
            console.log(`Updated screen: ${s.name} (${s._id})`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixScreens();
