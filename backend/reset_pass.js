const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config({ path: "backend/.env" });

async function resetPass() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model("User", userSchema);
        const findResult = await User.findOne({ name: { $regex: /Test User/i } });
        if (findResult) {
            console.log(`Found User: ${findResult.name} (${findResult.email})`);
            const hashedPassword = await bcrypt.hash("password123", 10);
            const updateResult = await User.updateOne({ _id: findResult._id }, { password: hashedPassword });
            if (updateResult.modifiedCount > 0) {
                console.log("SUCCESS_PASSWORD_RESET");
            } else {
                console.log("ERROR_PASSWORD_NOT_MODIFIED");
            }
        } else {
            console.log("ERROR_USER_NOT_FOUND");
        }
        process.exit(0);
    } catch (err) {
        console.error("ERROR:" + err.message);
        process.exit(1);
    }
}
resetPass();
