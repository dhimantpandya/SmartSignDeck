const mongoose = require('mongoose');

// MONGODB CONFIG
const MONGO_DB_URL = 'mongodb+srv://dhimantpandya6_db_user:SmartSign123@cluster0.anzjuct.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_DB_NAME = 'smartsigndeck';

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_DB_URL, { dbName: MONGO_DB_NAME });
  console.log('Connected.');

  const db = mongoose.connection.db;

  // 1. Migrate Templates
  console.log('Migrating Templates...');
  const templates = db.collection('templates');
  
  // Set visibility: "public" for isPublic: true
  const resT1 = await templates.updateMany(
    { isPublic: true, visibility: { $exists: false } },
    { $set: { visibility: 'public' } }
  );
  console.log(`Updated ${resT1.modifiedCount} public templates.`);

  // Set visibility: "private" for isPublic: false (or missing)
  const resT2 = await templates.updateMany(
    { isPublic: { $ne: true }, visibility: { $exists: false } },
    { $set: { visibility: 'private' } }
  );
  console.log(`Updated ${resT2.modifiedCount} private templates.`);

  // 2. Migrate Screens
  console.log('Migrating Screens...');
  const screens = db.collection('screens');

  const resS1 = await screens.updateMany(
    { isPublic: true, visibility: { $exists: false } },
    { $set: { visibility: 'public' } }
  );
  console.log(`Updated ${resS1.modifiedCount} public screens.`);

  const resS2 = await screens.updateMany(
    { isPublic: { $ne: true }, visibility: { $exists: false } },
    { $set: { visibility: 'private' } }
  );
  console.log(`Updated ${resS2.modifiedCount} private screens.`);

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
