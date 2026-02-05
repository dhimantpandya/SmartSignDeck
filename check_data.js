
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId,
    role: String
}, { strict: false });

const CompanySchema = new mongoose.Schema({
    name: String,
    ownerId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Company = mongoose.model('Company', CompanySchema);

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const email = 'dhimantpandya6@gmail.com';
        const user = await User.findOne({ email });
        console.log('User found:', JSON.stringify(user, null, 2));

        if (user && user.companyId) {
            const company = await Company.findById(user.companyId);
            console.log('Current linked Company:', JSON.stringify(company, null, 2));
        }

        const technostacks = await Company.findOne({ name: 'Technostacks' });
        console.log('Technostacks Company found:', JSON.stringify(technostacks, null, 2));

        const abc = await Company.findOne({ name: 'ABC' });
        console.log('ABC Company found:', JSON.stringify(abc, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkData();
