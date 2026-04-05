const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config({ path: "backend/.env" });

async function createUser() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_DB_URL);
        
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, enum: ["USER", "ADMIN", "SUPER_ADMIN"], default: "USER" },
            isEmailVerified: { type: Boolean, default: true }
        }, { strict: false });

        const User = mongoose.models.User || mongoose.model("User", userSchema);
        
        // Hashing password
        const hashedPassword = await bcrypt.hash("Password123!", 10);
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: "testuser@example.com" });
        if (existingUser) {
            console.log("SUCCESS_USER_ALREADY_EXISTS");
            process.exit(0);
        }

        // Creating User
        const newUser = new User({
            name: "Test User",
            email: "testuser@example.com",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            isEmailVerified: true
        });
        
        await newUser.save();
        console.log("SUCCESS_USER_CREATED");
        console.log("EMAIL:testuser@example.com");
        console.log("PASSWORD:Password123!");
        
        process.exit(0);
    } catch (err) {
        console.error("ERROR:" + err.message);
        process.exit(1);
    }
}
createUser();
