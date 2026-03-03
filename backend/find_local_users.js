const { MongoClient } = require('mongodb');

async function scanDatabases() {
    let client;
    try {
        console.log("Connecting to localhost:27017...");
        client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });

        const adminDb = client.db('admin');
        const dbList = await adminDb.admin().listDatabases();

        console.log(`Found ${dbList.databases.length} databases.`);

        for (const dbInfo of dbList.databases) {
            const db = client.db(dbInfo.name);

            // Check if 'users' collection exists
            const collections = await db.listCollections().toArray();
            const hasUsersArray = collections.find(c => c.name === 'users');

            if (hasUsersArray) {
                const users = await db.collection('users').find({}).toArray();
                console.log(`\n===================`);
                console.log(`Database: ${dbInfo.name}`);
                console.log(`Found ${users.length} users in 'users' collection.`);

                if (users.length > 0) {
                    console.log("Sample users:");
                    users.forEach(u => console.log(` - ${u.first_name} ${u.last_name} (${u.email})`));
                }
            }
        }
    } catch (err) {
        console.error("Scan failed:", err);
    } finally {
        if (client) await client.close();
    }
}

scanDatabases();
