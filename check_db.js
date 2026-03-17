const mongoose = require('mongoose');
const path = require('path');

// Mocking models to avoid loading full backend
const ScreenSchema = new mongoose.Schema({}, { strict: false });
const Screen = mongoose.model('Screen', ScreenSchema);
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function diagnose() {
  await mongoose.connect('mongodb://localhost:27017/smart-signage'); // Adjust URI if needed
  
  console.log('--- DIAGNOSIS START ---');
  
  const totalScreens = await Screen.countDocuments({});
  console.log('Total Screens in DB:', totalScreens);
  
  const trashedScreens = await Screen.find({ deletedAt: { $ne: null } });
  console.log('Trashed Screens Count:', trashedScreens.length);
  trashedScreens.forEach(s => {
    console.log(`- ID: ${s._id}, Name: ${s.name}, Visibility: ${s.visibility}, CompanyId: ${s.companyId}, createdBy: ${s.createdBy}, deletedAt: ${s.deletedAt}`);
  });

  const activeScreens = await Screen.find({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] });
  console.log('Active Screens Count:', activeScreens.length);
  activeScreens.forEach(s => {
    console.log(`- ID: ${s._id}, Name: ${s.name}, Visibility: ${s.visibility}, CompanyId: ${s.companyId}`);
  });

  const users = await User.find({});
  console.log('\n--- Users ---');
  users.forEach(u => {
    console.log(`- User: ${u.email}, Role: ${u.role}, Company: ${u.companyId}`);
  });

  await mongoose.disconnect();
  console.log('--- DIAGNOSIS END ---');
}

diagnose().catch(err => console.error(err));
