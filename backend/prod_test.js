const mongoose = require('mongoose');

const url = 'mongodb+srv://dhimantpandya6:1N5aJdZc7u880G5K@cluster0.pdtc0.mongodb.net/smartsigndeck?retryWrites=true&w=majority&appName=Cluster0';

async function checkProductionDB() {
    try {
        await mongoose.connect(url);
        console.log('Connected to production DB');

        const db = mongoose.connection.db;
        const requests = await db.collection('collaborationrequests').find({}).toArray();
        console.log("ALL REQUESTS:", JSON.stringify(requests, null, 2));

        const templates = await db.collection('templates').find({}, { projection: { name: 1, collaborators: 1, isPublic: 1, createdBy: 1 } }).limit(5).toArray();
        console.log("SAMPLE TEMPLATES:", JSON.stringify(templates, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error connecting to DB:', err);
        process.exit(1);
    }
}

checkProductionDB();
