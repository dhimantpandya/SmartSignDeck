const mongoose = require('mongoose');

async function checkRequests() {
    const mongoUri = 'mongodb://localhost:27017/smartsigndeck';
    console.log('Connecting to:', mongoUri);

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const requests = await db.collection('adminrequests').find({}).toArray();

        console.log(`Found ${requests.length} admin requests:`);
        requests.forEach((req, idx) => {
            console.log(`\n--- Request ${idx + 1} ---`);
            console.log(`ID: ${req._id}`);
            console.log(`Type: ${req.type}`);
            console.log(`Status: ${req.status}`);
            console.log(`Requester: ${req.requesterId}`);
            console.log(`Target User: ${req.targetUserId}`);
            console.log(`Details: ${JSON.stringify(req.details)}`);
            console.log(`Created At: ${req.createdAt}`);
        });

        const users = await db.collection('users').find({}).toArray();
        console.log(`\nTotal users in DB: ${users.length}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkRequests();
