const mongoose = require('mongoose');

async function checkOtherCompanies() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const Company = mongoose.model('Company', new mongoose.Schema({ name: String }, { strict: false }));

        const technostacksId = new mongoose.Types.ObjectId('698040e35f0b4d7e9641159e');
        const screens = await Screen.find({ companyId: { $ne: technostacksId } });

        console.log(`--- SCREENS NOT IN TECHNOSTACKS: ${screens.length} ---`);
        for (const s of screens) {
            const company = await Company.findById(s.companyId);
            console.log(`Name: "${s.name}" | ID: ${s._id} | Company: ${company ? company.name : 'Unknown'} (${s.companyId})`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOtherCompanies();
