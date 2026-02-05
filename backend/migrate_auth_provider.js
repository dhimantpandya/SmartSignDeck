// Migration script to set authProvider for existing users
// Run this script once to update all existing users

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/smartsigndeck';

async function migrateAuthProvider() {
    const client = new MongoClient(MONGODB_URL);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('users');

        // Count total users
        const totalUsers = await usersCollection.countDocuments();
        console.log(`Total users: ${totalUsers}`);

        // Set authProvider='google' for users with googleId
        const googleUsersResult = await usersCollection.updateMany(
            { googleId: { $exists: true, $ne: null } },
            { $set: { authProvider: 'google' } }
        );
        console.log(`✅ Updated ${googleUsersResult.modifiedCount} Google users`);

        // Set authProvider='local' for users without googleId
        const localUsersResult = await usersCollection.updateMany(
            {
                $or: [
                    { googleId: { $exists: false } },
                    { googleId: null }
                ]
            },
            { $set: { authProvider: 'local' } }
        );
        console.log(`✅ Updated ${localUsersResult.modifiedCount} local users`);

        // Verify migration
        const googleCount = await usersCollection.countDocuments({ authProvider: 'google' });
        const localCount = await usersCollection.countDocuments({ authProvider: 'local' });
        const unmigrated = await usersCollection.countDocuments({ authProvider: { $exists: false } });

        console.log('\n📊 Migration Results:');
        console.log(`  Google users: ${googleCount}`);
        console.log(`  Local users: ${localCount}`);
        console.log(`  Unmigrated: ${unmigrated}`);
        console.log(`  Total: ${googleCount + localCount + unmigrated}`);

        if (unmigrated > 0) {
            console.warn(`\n⚠️  Warning: ${unmigrated} users still don't have authProvider set`);
        } else {
            console.log('\n✅ Migration completed successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run migration
migrateAuthProvider()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
