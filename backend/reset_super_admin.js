const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config({ path: "backend/.env" });

async function resetSuperAdminPassword() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_DB_URL);
        
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model("User", userSchema);
        
        // Find the super admin
        const user = await User.findOne({ email: "smartsigndeckk@gmail.com" });
        if (!user) {
            console.log("ERROR: smartsigndeckk@gmail.com not found");
            process.exit(1);
        }
        console.log(`Found user: ${user.name} (${user.email}) - Role: ${user.role}`);
        
        // Reset password to a known value
        const newPassword = "SuperAdmin@123";
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
        
        console.log("SUCCESS: Password reset to SuperAdmin@123");
        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err.message);
        process.exit(1);
    }
}
resetSuperAdminPassword();
