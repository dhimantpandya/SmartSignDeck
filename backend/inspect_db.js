const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
    console.log('Connected to DB');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users found:', users.length);
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role}, CompanyID: ${u.companyId})`));

    const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
    console.log('\nCompanies found:', companies.length);
    companies.forEach(c => console.log(`- ${c.name} (${c._id})`));

    const templates = await mongoose.connection.db.collection('templates').find({}).toArray();
    console.log('\nTemplates found:', templates.length);

    const screens = await mongoose.connection.db.collection('screens').find({}).toArray();
    console.log('\nScreens found:', screens.length);

    await mongoose.disconnect();
}

run().catch(console.error);
