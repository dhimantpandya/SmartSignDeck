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
const PRIMARY_COMPANY_ID = '698040e35f0b4d7e9641159e';

async function broadDiagnose() {
    await mongoose.connect(MONGODB_URL);
    const log: string[] = [];
    log.push('---BROAD_DIAGNOSTIC---');

    const users = await User.find({ companyId: PRIMARY_COMPANY_ID });
    log.push(`\n---USERS IN COMPANY ${PRIMARY_COMPANY_ID} (${users.length})---`);
    users.forEach(u => {
        log.push(`U: ${u.email} | ID: ${u._id} | Name: ${u.first_name} ${u.last_name}`);
    });

    const userIds = users.map(u => u._id);

    // 1. Templates
    const templates = await Template.find({ companyId: PRIMARY_COMPANY_ID });
    log.push(`\n---TEMPLATES IN COMPANY (${templates.length})---`);
    templates.forEach(t => {
        log.push(`T: ${t.name} | ID: ${t._id} | CreatedBy: ${t.createdBy} | Public: ${t.isPublic}`);
    });

    // 2. Screens
    const screens = await Screen.find({ companyId: PRIMARY_COMPANY_ID });
    log.push(`\n---SCREENS IN COMPANY (${screens.length})---`);
    screens.forEach(s => {
        log.push(`S: ${s.name} | ID: ${s._id} | CreatedBy: ${s.createdBy}`);
    });

    // 3. Playlists
    const playlists = await Playlist.find({ companyId: PRIMARY_COMPANY_ID });
    log.push(`\n---PLAYLISTS IN COMPANY (${playlists.length})---`);
    playlists.forEach(p => {
        log.push(`P: ${p.name} | ID: ${p._id} | CreatedBy: ${p.createdBy}`);
    });

    log.push('\n---END_BROAD_DIAGNOSTIC---');
    fs.writeFileSync(path.join(__dirname, 'broad-diagnostic-results.txt'), log.join('\n'), 'utf8');
    console.log('Broad results written to broad-diagnostic-results.txt');
    process.exit(0);
}

broadDiagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
