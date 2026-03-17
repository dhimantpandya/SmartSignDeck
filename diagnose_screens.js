const mongoose = require('mongoose');
const Screen = require('./backend/src/models/screen.model').default;

async function diagnose() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/smartsigndeck'); // Adjust if needed
    console.log('Connected to DB');

    const screens = await Screen.find({ deletedAt: null });
    console.log(`Found ${screens.length} active screens`);

    screens.forEach(s => {
      console.log(`Screen: ${s.name} (${s._id})`);
      console.log(`  Status: ${s.status}`);
      console.log(`  LastPing: ${s.lastPing}`);
      console.log(`  CreatedBy: ${s.createdBy}`);
      console.log(`  CompanyId: ${s.companyId}`);
      console.log(`  Now: ${new Date()}`);
      if (s.lastPing) {
         const diff = (Date.now() - new Date(s.lastPing).getTime()) / 1000;
         console.log(`  Diff: ${diff}s`);
      }
      console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

diagnose();
