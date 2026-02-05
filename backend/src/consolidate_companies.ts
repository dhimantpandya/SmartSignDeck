
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    companyName: String,
    companyId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const CompanySchema = new mongoose.Schema({
    name: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Company = mongoose.model('Company', CompanySchema);

async function consolidate() {
    try {
        const mongoUrl = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
        const mongoDbName = process.env.MONGO_DB_NAME || 'smartsigndeck';
        await mongoose.connect(`${mongoUrl}/${mongoDbName}`);

        const companyName = 'Technostacks';
        const companies = await Company.find({ name: new RegExp(`^${companyName}$`, 'i') });

        if (companies.length <= 1) {
            console.log(`Only ${companies.length} company found with name "${companyName}". No consolidation needed.`);
            await mongoose.disconnect();
            return;
        }

        console.log(`Found ${companies.length} companies for "${companyName}".`);
        const primaryCompany = companies[0];
        const otherIds = companies.slice(1).map(c => c._id);

        console.log(`Primary Company: ${primaryCompany.name} (${primaryCompany._id})`);
        console.log(`Other IDs to merge:`, otherIds);

        // Update all users who point to any of these IDs or have the same name
        const updateResult = await User.updateMany(
            {
                $or: [
                    { companyId: { $in: companies.map(c => c._id) } },
                    { companyName: new RegExp(`^${companyName}$`, 'i') }
                ]
            },
            {
                $set: {
                    companyId: primaryCompany._id,
                    companyName: primaryCompany.name
                }
            }
        );

        console.log(`Updated ${updateResult.modifiedCount} users to primary company.`);

        // Delete the redundant companies
        const deleteResult = await Company.deleteMany({ _id: { $in: otherIds } });
        console.log(`Deleted ${deleteResult.deletedCount} redundant company records.`);

        await mongoose.disconnect();
        console.log('Consolidation complete.');
    } catch (error) {
        console.error('Error:', error);
    }
}

consolidate();
