const mongoose = require('mongoose');

async function debugFinal() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));

        const screens = await Screen.find({});
        console.log(`TOTAL DB SCREENS: ${screens.length}`);

        screens.forEach((s, i) => {
            console.log(`[${i + 1}] Name: "${s.name}" | ID: ${s._id} | CID: ${s.companyId} | Owner: ${s.createdBy}`);
        });

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

debugFinal();
