
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function findUsers() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
        const mongoDbName = process.env.MONGO_DB_NAME || 'smartsigndeck';
        await mongoose.connect(`${mongoUrl}/${mongoDbName}`);

        const users = await User.find({});
        users.forEach(u => console.log(`${u.email}: ${u.companyName}`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

findUsers();
