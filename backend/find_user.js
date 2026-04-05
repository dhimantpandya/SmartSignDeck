const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "backend/.env" });

async function findUser() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model("User", userSchema);
        const user = await User.findOne({ name: { $regex: /Test User/i } });
        if (user) {
            console.log("SUCCESS_FOUND_USER");
            console.log("EMAIL:" + user.email);
            console.log("ID:" + user._id);
        } else {
            console.log("ERROR_USER_NOT_FOUND");
        }
        process.exit(0);
    } catch (err) {
        console.error("ERROR:" + err.message);
        process.exit(1);
    }
}
findUser();
