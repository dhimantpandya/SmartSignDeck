import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Define the schema inline to avoid import issues
const userSchema = new mongoose.Schema({
    email: String,
    first_name: String,
    companyId: mongoose.Schema.Types.ObjectId,
    role: String
});

const User = mongoose.model('User', userSchema);

dotenv.config();

async function run() {
    const mongoUrl = process.env.MONGO_DB_URL;
    if (!mongoUrl) {
        console.error('MONGO_DB_URL is not defined in .env');
        process.exit(1);
    }
    console.log('Connecting...');
    await mongoose.connect(mongoUrl);
    console.log('Connected.');

    const count = await User.countDocuments();
    const users = await User.find({}, 'email first_name companyId role');

    console.log(`Total users: ${count}`);
    users.forEach(u => {
        console.log(` - ${u.email} (${u.first_name}) | Company: ${u.companyId} | Role: ${u.role}`);
    });

    await mongoose.disconnect();
}

run().catch(console.error);
