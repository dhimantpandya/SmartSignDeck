import mongoose from 'mongoose';
import { User } from './src/models';
import config from './src/config/config';
import fs from 'fs';

async function listUsers() {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        let out = `Connected to DB: ${mongoose.connection.db.databaseName}\n`;

        const users = await User.find({});
        out += `Total Users: ${users.length}\n`;
        users.forEach(u => {
            out += `- ID: ${u._id}, Email: "${u.email}", Verified: ${u.is_email_verified}, HasPW: ${!!u.password}\n`;
        });

        fs.writeFileSync('users_list.txt', out);
        console.log('Done');
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('users_list.txt', 'Error: ' + err.message);
    }
}

listUsers();
