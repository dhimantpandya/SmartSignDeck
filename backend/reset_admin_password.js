/**
 * Resets the super admin password directly in MongoDB Atlas
 * Run from: backend/ directory
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function resetAdminPassword() {
  try {
    const uri = process.env.MONGO_DB_URL.replace('?', '/smartsigndeck?');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME });
    console.log('Connected!');

    const newPassword = 'Admin@123456';
    const hash = await bcrypt.hash(newPassword, 10);

    const result = await mongoose.connection.collection('users').updateOne(
      { email: 'smartsigndeckk@gmail.com' },
      { $set: { password: hash } }
    );

    if (result.matchedCount > 0) {
      console.log('\n✅ Super Admin password reset successfully!');
      console.log('--------------------------------------------');
      console.log('Email:    smartsigndeckk@gmail.com');
      console.log('Password: Admin@123456');
      console.log('--------------------------------------------\n');
    } else {
      console.log('❌ User not found in database!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetAdminPassword();
