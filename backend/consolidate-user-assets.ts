import mongoose from 'mongoose';
import Template from './src/models/template.model';
import Screen from './src/models/screen.model';
import Playlist from './src/models/playlist.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/smartsigndeck';
const PRIMARY_USER_ID = new mongoose.Types.ObjectId('6980409f5f0b4d7e96411597');
const SECONDARY_IDS = [
    new mongoose.Types.ObjectId('698088727a88d2ad37ee1349'),
    new mongoose.Types.ObjectId('6980b18f38ffb60ed6d17300')
];

async function consolidateAssets() {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to DB');

    // 1. Templates
    const tResult = await Template.updateMany(
        { createdBy: { $in: SECONDARY_IDS } },
        { createdBy: PRIMARY_USER_ID }
    );
    console.log(`Updated ${tResult.modifiedCount} templates`);

    // 2. Screens
    const sResult = await Screen.updateMany(
        { createdBy: { $in: SECONDARY_IDS } },
        { createdBy: PRIMARY_USER_ID }
    );
    console.log(`Updated ${sResult.modifiedCount} screens`);

    // 3. Playlists 
    const pResult = await Playlist.updateMany(
        { createdBy: { $in: SECONDARY_IDS } },
        { createdBy: PRIMARY_USER_ID }
    );
    console.log(`Updated ${pResult.modifiedCount} playlists`);

    process.exit(0);
}

consolidateAssets().catch(err => {
    console.error(err);
    process.exit(1);
});
