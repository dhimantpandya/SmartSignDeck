const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function migrate() {
    const uri = 'mongodb://localhost:27017/smartsigndeck';
    try {
        const conn = await mongoose.createConnection(uri);
        console.log('Connected to MongoDB');

        const idFields = ['companyId', 'createdBy', 'templateId', 'screenId', 'parentId'];
        const collections = ['users', 'templates', 'screens', 'playbacklogs', 'folders'];

        for (const colName of collections) {
            console.log(`\nProcessing collection: ${colName}`);
            const collection = conn.db.collection(colName);
            const cursor = collection.find({});

            let count = 0;
            let updated = 0;

            while (await cursor.hasNext()) {
                const doc = await cursor.next();
                count++;
                const updates = {};

                idFields.forEach(field => {
                    const value = doc[field];
                    if (value && typeof value === 'string' && value.length === 24 && /^[0-9a-fA-F]{24}$/.test(value)) {
                        try {
                            updates[field] = new ObjectId(value);
                        } catch (e) {
                            // Skip invalid ones
                        }
                    }
                });

                if (Object.keys(updates).length > 0) {
                    await collection.updateOne({ _id: doc._id }, { $set: updates });
                    updated++;
                }

                if (count % 100 === 0) console.log(`  Processed ${count} documents...`);
            }
            console.log(`  Finished ${colName}. Processed: ${count}, Updated: ${updated}`);
        }

        console.log('\nMigration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
