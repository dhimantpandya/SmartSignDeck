const mongoose = require('mongoose');

async function verify() {
    const uri = 'mongodb://localhost:27017/smartsigndeck';
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // The expected key from the error message
        const expectedKey = '2bb8511eef7d574f78f0e9ca868cde3b';
        const receivedKey = '2bb8511eef7d574f78f673f0e9ca868cde3b';

        const screen = await mongoose.connection.db.collection('screens').findOne({ secretKey: expectedKey });

        if (screen) {
            console.log('Found screen with EXPECTED key:');
            console.log(JSON.stringify(screen, null, 2));

            // Check if ID matches
            console.log('Screen ID:', screen._id.toString());
        } else {
            console.log('Screen with EXPECTED key NOT FOUND.');
        }

        // Check if potentially another screen has the received key?
        const screen2 = await mongoose.connection.db.collection('screens').findOne({ secretKey: receivedKey });
        if (screen2) {
            console.log('Found screen with RECEIVED key (This would be weird):');
            console.log(JSON.stringify(screen2, null, 2));
        } else {
            console.log('No screen found with RECEIVED key.');
        }

        // Look for partial matches
        const allScreens = await mongoose.connection.db.collection('screens').find({}).toArray();
        console.log(`Scanning ${allScreens.length} screens for key anomalies...`);

        allScreens.forEach(s => {
            if (s.secretKey && s.secretKey.includes('673f')) {
                console.log('Found screen with "673f" in secretKey:', s._id, s.secretKey);
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
