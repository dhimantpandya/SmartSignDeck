const { MongoClient } = require('mongodb');

async function wipeDatabase() {
    const uri = "mongodb+srv://dhimantpandya6_db_user:SmartSign123@cluster0.anzjuct.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const client = new MongoClient(uri);

    try {
        console.log("Connecting to Atlas cluster...");
        await client.connect();
        const db = client.db("smartsigndeck");

        console.log("Fetching collections...");
        const collections = await db.listCollections().toArray();

        if (collections.length === 0) {
            console.log("Database is already empty.");
            return;
        }

        for (const collection of collections) {
            console.log(`Dropping collection: ${collection.name}`);
            await db.collection(collection.name).drop();
        }

        console.log("✅ Database wiped successfully!");
    } catch (err) {
        console.error("❌ Failed to wipe database:", err.message);
    } finally {
        await client.close();
    }
}

wipeDatabase();
