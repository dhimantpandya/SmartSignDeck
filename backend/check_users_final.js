const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function run() {
    const mongoUrl = process.env.MONGO_DB_URL;
    if (!mongoUrl) {
        console.error('MONGO_DB_URL is missing');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Connected.');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const allUsers = await User.find({}, 'email first_name last_name role companyId');
    console.log(`Total Users found: ${allUsers.length}`);

    allUsers.forEach(u => {
        console.log(` - ${u.email} | Name: ${u.first_name} ${u.last_name} | Role: ${u.role} | Company: ${u.companyId}`);
    });

    const smartUser = allUsers.find(u => u.email === 'smartsigndeck@gmail.com');
    if (smartUser) {
        console.log('\nSUCCESS: smartsigndeck@gmail.com found!');
    } else {
        console.log('\nFAILURE: smartsigndeck@gmail.com NOT found in database.');
    }

    await mongoose.disconnect();
}

run().catch(console.error);
