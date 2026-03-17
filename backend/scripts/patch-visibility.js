const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_DB_URL;

if (!MONGO_URL) {
  console.error('MONGO_DB_URL not found in .env');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected.');

    const db = client.db();

    // Patch Templates
    console.log('Patching Templates...');
    const templatesCol = db.collection('templates');
    const templateResults = await templatesCol.updateMany(
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
    const screensCol = db.collection('screens');
    const screenResults = await screensCol.updateMany(
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
  } catch (error) {
    console.error('Error during patch:', error);
    process.exit(1);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
