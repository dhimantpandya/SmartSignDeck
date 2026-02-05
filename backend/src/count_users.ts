
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    companyName: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function countByCompany() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
        const mongoDbName = process.env.MONGO_DB_NAME || 'smartsigndeck';
        await mongoose.connect(`${mongoUrl}/${mongoDbName}`);

        const stats = await User.aggregate([
            { $group: { _id: "$companyName", count: { $sum: 1 } } }
        ]);

        console.log('User counts by company:');
        stats.forEach(s => {
            console.log(`- "${s._id}": ${s.count}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

countByCompany();
