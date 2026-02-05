
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId,
    role: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function listUsers() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
        const mongoDbName = process.env.MONGO_DB_NAME || 'smartsigndeck';
        await mongoose.connect(`${mongoUrl}/${mongoDbName}`);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('Total users found:', users.length);

        users.forEach(u => {
            console.log(`- ${u.email} | Company: ${u.companyName} | ID: ${u.companyId} | Role: ${u.role}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listUsers();
