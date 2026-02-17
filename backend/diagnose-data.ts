import mongoose from 'mongoose';
import User from './src/models/user.model';
import Template from './src/models/template.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/smartsigndeck';

import * as fs from 'fs';

async function diagnose() {
    await mongoose.connect(MONGODB_URL);
    const log: string[] = [];
    log.push('---START_DIAGNOSTIC---');

    const users = await User.find({});
    log.push('---USERS---');
    users.forEach(u => {
        log.push(`USER_LOG: ${u.email} | ID: ${u._id} | Company: ${u.companyId}`);
    });

    const templates = await Template.find({});
    log.push('---TEMPLATES---');
    templates.forEach(t => {
        log.push(`TEMPLATE_LOG: ${t.name} | ID: ${t._id} | Company: ${t.companyId} | Creator: ${t.createdBy} | Public: ${t.isPublic}`);
    });

    log.push('---END_DIAGNOSTIC---');
    fs.writeFileSync(path.join(__dirname, 'diagnostic-results-direct.txt'), log.join('\n'), 'utf8');
    console.log('Diagnostic written to diagnostic-results-direct.txt');
    process.exit(0);
}

diagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
