
import mongoose from 'mongoose';
import { Token, User } from './src/models';
import { tokenTypes } from './src/config/tokens';
import config from './src/config/config';

async function run() {
    await mongoose.connect(config.mongoose.url);
    console.log('Connected to DB');

    // 1. Create a dummy user
    const email = 'test_check_' + Date.now() + '@example.com';
    const user = await User.create({
        first_name: 'Test',
        last_name: 'User',
        email,
        password: 'Password1!',
        role: 'user',
        is_email_verified: false
    });

    // 2. Create a token with a specific OTP
    const correctOtp = '123456';
    await Token.create({
        jti: 'check-jti',
        user: user._id,
        type: tokenTypes.VERIFY_EMAIL,
        expires: new Date(Date.now() + 1000 * 60 * 60),
        otp: correctOtp,
        blacklisted: false
    });

    // 3. Try findOne with undefined OTP
    const doc = await Token.findOne({
        user: user._id,
        type: tokenTypes.VERIFY_EMAIL,
        otp: undefined, // Mongoose might strip this!
        blacklisted: false
    });

    if (doc) {
        console.log('CRITICAL: findOne with otp:undefined MATCHED document with otp:', doc.otp);
    } else {
        console.log('SUCCESS: findOne with otp:undefined did NOT match.');
    }

    await mongoose.disconnect();
}

run().catch(console.error);
