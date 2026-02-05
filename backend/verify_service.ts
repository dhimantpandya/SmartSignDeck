
import mongoose from 'mongoose';
import screenService from './src/services/screen.service';
import { User } from './src/models';

async function verify() {
    const uri = 'mongodb://localhost:27017/smartsigndeck';
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Mock User
        // We need a real user ID from DB to ensure it works
        const user = await User.findOne({});
        if (!user) {
            console.log('No user found');
            process.exit(0);
        }
        console.log('Testing with user:', user.email);

        const result = await screenService.queryScreens({}, { limit: 100 }, user);

        // Check results
        let foundCorruption = false;
        result.results.forEach((s: any) => {
            const key = s.secretKey;
            console.log(`Screen: ${s.name}, Key: ${key} (Length: ${key?.length})`);

            if (key && key.includes('673f')) {
                console.log('CRITICAL: Found 673f in service output for screen:', s.id);
                foundCorruption = true;
            }
        });

        if (!foundCorruption) {
            console.log('Service output seems CLEAN.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
