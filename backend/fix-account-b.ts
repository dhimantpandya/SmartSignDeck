import mongoose from 'mongoose';
import Template from './src/models/template.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/smartsigndeck';

async function fixAccountB() {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected');

    const ACCOUNT_B_ID = new mongoose.Types.ObjectId('698186430a37de04e58fc06f');
    const ACCOUNT_B_COMPANY = new mongoose.Types.ObjectId('698186920a37de04e58fc07c');

    const result = await Template.updateMany(
        { createdBy: ACCOUNT_B_ID },
        { companyId: ACCOUNT_B_COMPANY }
    );

    console.log(`Updated ${result.modifiedCount} templates for Account B to company ${ACCOUNT_B_COMPANY}`);
    process.exit(0);
}

fixAccountB().catch(err => {
    console.error(err);
    process.exit(1);
});
