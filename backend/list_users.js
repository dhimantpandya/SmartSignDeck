const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "backend/.env" });

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model("User", userSchema);
        const users = await User.find({}, { name: 1, email: 1 });
        if (users.length > 0) {
            console.log("USERS_FOUND:");
            users.forEach(u => console.log(`- ${u.name} (${u.email})`));
        } else {
            console.log("NO_USERS_FOUND");
        }
        process.exit(0);
    } catch (err) {
        console.error("ERROR:" + err.message);
        process.exit(1);
    }
}
listUsers();
