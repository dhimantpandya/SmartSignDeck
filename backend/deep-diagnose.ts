import mongoose from 'mongoose';
import User from './src/models/user.model';
import Template from './src/models/template.model';
import Screen from './src/models/screen.model';
import Playlist from './src/models/playlist.model';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/smartsigndeck';

async function deepDiagnose() {
    await mongoose.connect(MONGODB_URL);
    const log: string[] = [];
    log.push('---DEEP_DIAGNOSTIC---');

    const targetEmail = 'dhimant.pandya@technostacks.in'; // Assuming this is the main user
    const users = await User.find({ email: targetEmail });

    log.push(`Searching for assets for email: ${targetEmail}`);
    log.push(`Found ${users.length} user record(s).`);

    const userIds = users.map(u => u._id);
    log.push(`User IDs to search for: ${userIds.join(', ')}`);

    // 1. Templates
    const templates = await Template.find({
        $or: [
            { createdBy: { $in: userIds } },
            { companyId: { $in: users.map(u => u.companyId).filter(id => id) } }
        ]
    });
    log.push(`\n---TEMPLATES FOUND (${templates.length})---`);
    templates.forEach(t => {
        log.push(`T: ${t.name} | ID: ${t._id} | CreatedBy: ${t.createdBy} | Co: ${t.companyId} | Public: ${t.isPublic}`);
    });

    // 2. Screens
    const screens = await Screen.find({
        $or: [
            { createdBy: { $in: userIds } },
            { companyId: { $in: users.map(u => u.companyId).filter(id => id) } }
        ]
    });
    log.push(`\n---SCREENS FOUND (${screens.length})---`);
    screens.forEach(s => {
        log.push(`S: ${s.name} | ID: ${s._id} | CreatedBy: ${s.createdBy} | Co: ${s.companyId}`);
    });

    // 3. Playlists
    const playlists = await Playlist.find({
        $or: [
            { createdBy: { $in: userIds } },
            { companyId: { $in: users.map(u => u.companyId).filter(id => id) } }
        ]
    });
    log.push(`\n---PLAYLISTS FOUND (${playlists.length})---`);
    playlists.forEach(p => {
        log.push(`P: ${p.name} | ID: ${p._id} | CreatedBy: ${p.createdBy} | Co: ${p.companyId}`);
    });

    log.push('\n---END_DEEP_DIAGNOSTIC---');
    fs.writeFileSync(path.join(__dirname, 'deep-diagnostic-results.txt'), log.join('\n'), 'utf8');
    console.log('Results written to deep-diagnostic-results.txt');
    process.exit(0);
}

deepDiagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
