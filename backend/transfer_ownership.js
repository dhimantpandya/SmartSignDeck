const { MongoClient, ObjectId } = require('mongodb');

const REMOTE_URI = 'mongodb+srv://dhimantpandya6_db_user:tL6oJs6GgggVjneu@cluster0.anzjuct.mongodb.net/smartsigndeck?retryWrites=true&w=majority';

// The ID of the account that owns the templates (dhimant.pandya@technostacks.in)
const OLD_USER_ID = new ObjectId('698040e35f0b4d7e9641159e');
// The ID of the account the user logged in with (dhimantpandya6@gmail.com)
const NEW_USER_ID = new ObjectId('698088727a88d2ad37ee1349');

async function transferOwnership() {
    let client;
    try {
        console.log('Connecting to Remote Database...');
        client = await MongoClient.connect(REMOTE_URI, { useUnifiedTopology: true });
        const db = client.db('smartsigndeck');

        console.log(`Transferring ownership from ${OLD_USER_ID} to ${NEW_USER_ID}...`);

        // Update Templates
        const templatesResult = await db.collection('templates').updateMany(
            { createdBy: OLD_USER_ID },
            { $set: { createdBy: NEW_USER_ID } }
        );
        console.log(`Updated ${templatesResult.modifiedCount} Templates`);

        // Update Screens
        const screensResult = await db.collection('screens').updateMany(
            { createdBy: OLD_USER_ID },
            { $set: { createdBy: NEW_USER_ID } }
        );
        console.log(`Updated ${screensResult.modifiedCount} Screens`);

        // Update Playlists
        const playlistsResult = await db.collection('playlists').updateMany(
            { createdBy: OLD_USER_ID },
            { $set: { createdBy: NEW_USER_ID } }
        );
        console.log(`Updated ${playlistsResult.modifiedCount} Playlists`);

        // Let's also ensure the company IDs match up if needed
        // Assuming both users are in the same company or we want to move the data fully
        // The templates might also have "companyId" set to the technostacks company.
        // Let's get the new user's company ID
        const newUser = await db.collection('users').findOne({ _id: NEW_USER_ID });
        if (newUser && newUser.companyId) {
            console.log(`New user belongs to company: ${newUser.companyId}. Updating template/screen companies...`);
            await db.collection('templates').updateMany(
                { createdBy: NEW_USER_ID },
                { $set: { companyId: newUser.companyId } }
            );
            await db.collection('screens').updateMany(
                { createdBy: NEW_USER_ID },
                { $set: { companyId: newUser.companyId } }
            );
            await db.collection('playlists').updateMany(
                { createdBy: NEW_USER_ID },
                { $set: { companyId: newUser.companyId } }
            );
            console.log("Updated target companies to match new user.");
        }

        console.log('Transfer complete!');

    } catch (err) {
        console.error('Transfer failed:', err);
    } finally {
        if (client) await client.close();
    }
}

transferOwnership();
