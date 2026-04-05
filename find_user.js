const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "backend/.env" });

async function findUser() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        const User = mongoose.model("User", new mongoose.Schema({ name: String, email: String }));
        const user = await User.findOne({ name: "Test User" });
        if (user) {
            print(`Found Test User: ${user.email}`);
        } else {
            print("Test User not found.");
        }
        process.exit(0);
    } catch (err) {
        print(`Error: ${err.message}`);
        process.exit(1);
    }
}
findUser();
