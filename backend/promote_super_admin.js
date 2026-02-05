const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
    first_name: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function updateRoles() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL + '/' + process.env.MONGO_DB_NAME || 'mongodb://localhost:27017/smartsigndeck');
        console.log("Connected to MongoDB for Role Update");

        const targetEmail = 'smartsigndeck@gmail.com';

        // 1. Promote smartsigndeck@gmail.com to super_admin
        const superAdminUpdate = await User.updateOne(
            { email: targetEmail },
            { $set: { role: 'super_admin' } }
        );

        if (superAdminUpdate.matchedCount === 0) {
            console.log(`User with email ${targetEmail} NOT FOUND.`);
        } else {
            console.log(`Successfully promoted ${targetEmail} to SUPER_ADMIN.`);
        }

        // 2. Demote all other admins to user (so you can test promoting them back)
        const demoteUpdate = await User.updateMany(
            { email: { $ne: targetEmail }, role: 'admin' },
            { $set: { role: 'user' } }
        );

        console.log(`Demoted ${demoteUpdate.modifiedCount} other admins to USER.`);

        // 3. List current users to verify
        const allUsers = await User.find({}, 'email role first_name');
        console.log("\n--- Updated User Roles ---");
        allUsers.forEach(u => console.log(`${u.first_name} (${u.email}) -> ${u.role}`));

    } catch (error) {
        console.error("Error updating roles:", error);
    } finally {
        await mongoose.disconnect();
    }
}

updateRoles();
