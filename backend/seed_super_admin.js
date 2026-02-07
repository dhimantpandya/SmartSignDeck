const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
    const mongoUrl = process.env.MONGO_DB_URL;
    if (!mongoUrl) {
        console.error("MONGO_DB_URL not found in .env");
        process.exit(1);
    }
    await mongoose.connect(mongoUrl);

    const email = "smartsigndeck@gmail.com";

    // Define a minimal schema for the User model
    const userSchema = new mongoose.Schema({
        first_name: String,
        last_name: String,
        email: { type: String, lowercase: true, trim: true },
        role: String,
        authProvider: String,
        is_email_verified: Boolean,
        onboardingCompleted: Boolean,
        password: String
    });

    // Check if model already exists to avoid OverwriteModelError
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
        console.log(`User ${email} already exists. Updating role to super_admin...`);
        user.role = "super_admin";
        user.onboardingCompleted = true;
        await user.save();
        console.log("Updated successfully.");
    } else {
        console.log(`Creating new super_admin: ${email}`);
        await User.create({
            email: email.toLowerCase(),
            first_name: "SmartSignDeck",
            last_name: "Admin",
            role: "super_admin",
            authProvider: "google",
            is_email_verified: true,
            onboardingCompleted: true,
            password: "DefaultPassword123!" // Fallback password
        });
        console.log("Created successfully.");
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
