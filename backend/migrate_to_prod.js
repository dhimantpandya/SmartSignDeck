const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://localhost:27017/smartsigndeck';
const REMOTE_URI = 'mongodb+srv://dhimantpandya6_db_user:tL6oJs6GgggVjneu@cluster0.anzjuct.mongodb.net/smartsigndeck?retryWrites=true&w=majority';

async function migrate() {
    console.log('Starting migration from LOCAL to REMOTE...');

    let localClient, remoteClient;

    try {
        console.log('Connecting to Local Database...');
        localClient = await MongoClient.connect(LOCAL_URI, { useUnifiedTopology: true });
        const localDb = localClient.db('smartsigndeck');

        console.log('Connecting to Remote Database...');
        remoteClient = await MongoClient.connect(REMOTE_URI, { useUnifiedTopology: true });
        const remoteDb = remoteClient.db('smartsigndeck');

        // Note: we can list all collections in local database
        const collections = await localDb.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log(`Found ${collectionNames.length} collections locally:`, collectionNames);

        for (const collectionName of collectionNames) {
            console.log(`\nMigration migrating collection: ${collectionName}`);

            const localCollection = localDb.collection(collectionName);
            const remoteCollection = remoteDb.collection(collectionName);

            // Fetch all documents from local
            const docs = await localCollection.find({}).toArray();
            console.log(`Found ${docs.length} documents locally in ${collectionName}`);

            if (docs.length > 0) {
                // To avoid duplicate key errors, we'll clear the remote collection first
                // OR we can insert one by one using upsert. 
                // Since this is a fresh database, bulk inserting is fine. But let's clear it first just in case.
                console.log(`Clearing existing documents in remote ${collectionName}...`);
                await remoteCollection.deleteMany({});

                console.log(`Inserting ${docs.length} documents into remote ${collectionName}...`);
                await remoteCollection.insertMany(docs);
                console.log(`Successfully migrated ${collectionName}!`);
            } else {
                console.log(`Skipping empty collection: ${collectionName}`);
            }
        }

        console.log('\n======================================================');
        console.log('✅ DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('Your local templates and screens are now on the live site!');
        console.log('======================================================\n');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (localClient) await localClient.close();
        if (remoteClient) {
            console.log("Closing remote connection...");
            await remoteClient.close();
        }
    }
}

migrate();
