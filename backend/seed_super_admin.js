const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
    const mongoUrl = process.env.MONGO_DB_URL;
    if (!mongoUrl) {
        process.exit(1);
    }
    await mongoose.connect(mongoUrl);

    const email = "smartsigndeck@gmail.com";
    const User = mongoose.model('User', new mongoose.Schema({
        first_name: String,
        last_name: String,
        email: String,
        role: String,
        authProvider: String,
        is_email_verified: Boolean,
        onboardingCompleted: Boolean,
        password: String
    }));

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
        console.log(`User ${email} already exists. Updating...`);
        user.role = "super_admin";
        user.first_name = "SmartSignDeck";
        user.onboardingCompleted = true;
        await user.save();
        console.log("Updated.");
    } else {
        console.log(`Creating new super_admin: ${email}`);
        await User.create({
            email: email.toLowerCase(),
            first_name: "SmartSignDeck",
            last_name: "",
            role: "super_admin",
            authProvider: "google",
            is_email_verified: true,
            onboardingCompleted: true,
            password: "DefaultPassword123!"
        });
        console.log("Created.");
    }

    await mongoose.disconnect();
}

run().catch(console.error);
