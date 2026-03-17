import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_DB_URL;

if (!MONGO_URL) {
  console.error('MONGO_DB_URL not found in .env');
  process.exit(1);
}

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URL);
    console.log('Connected.');

    const db = mongoose.connection.db;

    // Patch Templates
    console.log('Patching Templates...');
    const templateResults = await db.collection('templates').updateMany(
      { visibility: { $exists: false } },
      [
        {
          $set: {
            visibility: {
              $cond: { if: { $eq: ['$isPublic', true] }, then: 'public', else: 'private' }
            }
          }
        }
      ]
    );
    console.log(`Modified ${templateResults.modifiedCount} templates.`);

    // Patch Screens
    console.log('Patching Screens...');
    const screenResults = await db.collection('screens').updateMany(
      { visibility: { $exists: false } },
      [
        {
          $set: {
            visibility: {
              $cond: { if: { $eq: ['$isPublic', true] }, then: 'public', else: 'private' }
            }
          }
        }
      ]
    );
    console.log(`Modified ${screenResults.modifiedCount} screens.`);

    console.log('Patch completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during patch:', error);
    process.exit(1);
  }
}

run();
