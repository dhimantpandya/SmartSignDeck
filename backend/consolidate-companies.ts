import mongoose from 'mongoose';
import User from './src/models/user.model';
import Template from './src/models/template.model';
import Screen from './src/models/screen.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/smartsigndeck';
const PRIMARY_COMPANY_ID = '698040e35f0b4d7e9641159e';

async function consolidate() {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const targetCompanyId = new mongoose.Types.ObjectId(PRIMARY_COMPANY_ID);

    // 1. Move all users to primary company (for this test setup)
    const uResult = await User.updateMany(
        { email: { $in: ['dhimant.pandya@technostacks.in', 'dhimantpandya6@gmail.com', 'smartsigndeck@gmail.com'] } },
        { companyId: targetCompanyId }
    );
    console.log(`Updated ${uResult.modifiedCount} users to company ${PRIMARY_COMPANY_ID}`);

    // 2. Align all templates created by these users to this company
    const tResult = await Template.updateMany(
        {
            createdBy: {
                $in: [
                    new mongoose.Types.ObjectId('6980409f5f0b4d7e96411597'),
                    new mongoose.Types.ObjectId('698088727a88d2ad37ee1349'),
                    new mongoose.Types.ObjectId('698186430a37de04e58fc06f')
                ]
            }
        },
        { companyId: targetCompanyId }
    );
    console.log(`Updated ${tResult.modifiedCount} templates to company ${PRIMARY_COMPANY_ID}`);

    // 3. Align screens too
    const sResult = await Screen.updateMany(
        {
            createdBy: {
                $in: [
                    new mongoose.Types.ObjectId('6980409f5f0b4d7e96411597'),
                    new mongoose.Types.ObjectId('698088727a88d2ad37ee1349'),
                    new mongoose.Types.ObjectId('698186430a37de04e58fc06f')
                ]
            }
        },
        { companyId: targetCompanyId }
    );
    console.log(`Updated ${sResult.modifiedCount} screens to company ${PRIMARY_COMPANY_ID}`);

    console.log('Consolidation complete.');
    process.exit(0);
}

consolidate().catch(err => {
    console.error(err);
    process.exit(1);
});
