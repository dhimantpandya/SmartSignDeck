const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected');

    const Template = mongoose.model('Template', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const collabs = await Template.find({ collaborators: { $exists: true, $ne: [] } });
    console.log(`Found ${collabs.length} templates with collaborators`);

    collabs.forEach(t => {
        console.log(`Template: ${t.name} (${t._id}) | Collaborators: ${JSON.stringify(t.collaborators)}`);
    });

    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    users.forEach(u => console.log(`User: ${u.email} (${u._id})`));

    process.exit(0);
}

run();
