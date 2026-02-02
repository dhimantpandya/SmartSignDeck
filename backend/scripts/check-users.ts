import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkUsers() {
    try {
        const dbUrl = process.env.MONGO_DB_URL!;
        const dbName = process.env.MONGO_DB_NAME!;
        console.log(`Connecting to ${dbUrl} / DB: ${dbName}`);
        await mongoose.connect(dbUrl, { dbName });
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`- ${u.email} | Role: ${u.role} | CompanyID: ${u.companyId || 'NONE'} | CompanyName: ${u.companyName || 'NONE'}`);
        });

        const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
        console.log('\n--- ALL COMPANIES ---');
        companies.forEach(c => {
            console.log(`- ${c.name} | ID: ${c._id} | Owner: ${c.ownerId}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
