
import mongoose from 'mongoose';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { User } from './src/models';

async function verify() {
    const uri = 'mongodb://localhost:27017/smartsigndeck';
    const jwtSecret = '6kK8GRVG0nExb7lTLRkmZGTyTsm/Yrv318iDv7jS8SjFh2ZY3mmD+Q+2/M9CPqtt';

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const user = await User.findOne({});
        if (!user) {
            console.log('No user found');
            process.exit(0);
        }
        console.log('Using user:', user.email);

        // Generate Token
        // Payload structure must match what passport strategy expects
        const payload = {
            sub: user._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60),
            type: 'access'
        };

        const token = jwt.sign(payload, jwtSecret);
        console.log('Generated Token');

        // Call API
        const url = 'http://localhost:5000/v1/screens';
        console.log('Calling:', url);

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Check Response
        const results = response.data.results || response.data.data?.results || [];
        let foundCorruption = false;

        results.forEach((s: any) => {
            const key = s.secretKey;
            console.log(`Screen: ${s.name}, Key: ${key} (Length: ${key?.length})`);

            if (key && key.includes('673f')) {
                console.log('CRITICAL: Found 673f in API RESPONSE for screen:', s.id);
                foundCorruption = true;
            }
        });

        if (!foundCorruption) {
            console.log('API RESPONSE seems CLEAN.');
        }

        process.exit(0);
    } catch (err: any) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data));
        }
        process.exit(1);
    }
}

verify();
