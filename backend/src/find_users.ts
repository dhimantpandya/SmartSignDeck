
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

        const users = await User.find({ companyName: /ABC/i });
        console.log(`Found ${users.length} users with "ABC" company name.`);
        users.forEach(u => console.log(`- ${u.email}`));

        const nullUsers = await User.find({ companyName: null });
        console.log(`Found ${nullUsers.length} users with null company name.`);
        nullUsers.forEach(u => console.log(`- ${u.email}`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

findUsers();
