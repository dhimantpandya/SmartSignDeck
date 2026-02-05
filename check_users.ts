import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function checkUsers() {
    const url = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
    const dbName = process.env.MONGO_DB_NAME || 'smartsigndeck';

    console.log(`Connecting to ${url} / ${dbName}...`);

    try {
        await mongoose.connect(url, { dbName });
        console.log('Connected to MongoDB');

        // Define a minimal schema
        const userSchema = new mongoose.Schema({
            email: String,
            is_email_verified: Boolean
        });

        const User = mongoose.model('User', userSchema, 'users');

        const users = await User.find({});
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- Email: "${u.email}", Verified: ${u.is_email_verified}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUsers();
