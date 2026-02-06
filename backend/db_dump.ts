import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const mongoUrl = process.env.MONGO_DB_URL;
const dbName = process.env.MONGO_DB_NAME;

if (!mongoUrl || !dbName) {
    process.exit(1);
}

const fullUrl = mongoUrl.includes('?')
    ? mongoUrl.replace('?', `/${dbName}?`)
    : (mongoUrl.endsWith('/') ? `${mongoUrl}${dbName}` : `${mongoUrl}/${dbName}`);

const checkDb = async () => {
    try {
        await mongoose.connect(fullUrl);
        const db = mongoose.connection.db;
        if (!db) {
            console.log("No DB connection");
            return;
        }
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`Collection [${coll.name}]: ${count} documents`);
            if (coll.name === 'users') {
                const users = await db.collection('users').find({}).toArray();
                users.forEach(u => console.log(` - User: ${u.email}, First: ${u.first_name}, Onboarding: ${u.onboardingCompleted}`));
            }
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

checkDb();
