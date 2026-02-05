const mongoose = require('mongoose');

async function checkSmartSignDeck() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));

        const companyId = new mongoose.Types.ObjectId('698045920b78c9641159ed41');
        const screens = await Screen.find({ companyId: companyId });

        console.log(`--- SCREENS IN SMART SIGN DECK (${companyId}) ---`);
        for (const s of screens) {
            console.log(`Name: "${s.name}" | ID: ${s._id}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSmartSignDeck();
