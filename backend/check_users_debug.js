
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId,
    onboardingCompleted: Boolean
});

const User = mongoose.model('User', UserSchema);

async function checkUsers() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL;
        if (!mongoUrl) {
            console.error('MONGO_DB_URL not found in environment');
            process.exit(1);
        }

        await mongoose.connect(mongoUrl, { dbName: process.env.MONGO_DB_NAME });
        console.log('Connected to MongoDB');

        const users = await User.find({ email: /dhimant/i });
        console.log('Users found:', JSON.stringify(users, null, 2));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();
