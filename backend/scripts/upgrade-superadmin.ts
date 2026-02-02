import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function upgradeUser() {
    try {
        const dbUrl = process.env.MONGO_DB_URL!;
        const dbName = process.env.MONGO_DB_NAME!;
        await mongoose.connect(dbUrl, { dbName });

        const email = 'dhimant.pandya@technostacks.in';
        const result = await mongoose.connection.db.collection('users').updateOne(
            { email },
            { $set: { role: 'super_admin' } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully upgraded ${email} to super_admin`);
        } else {
            console.log(`User ${email} not found`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

upgradeUser();
