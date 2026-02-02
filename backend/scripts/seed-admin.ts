import mongoose from "mongoose";
import User from "../src/models/user.model";
import { Role, Permission } from "../src/models";
import config from "../src/config/config";
import { defaultRoles, defaultPermissions } from "../tests/fixtures/role.fixture";

const seedAdmin = async () => {
    await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
    console.log("Connected to MongoDB");

    try {
        await Role.insertMany(defaultRoles);
        await Permission.insertMany(defaultPermissions);
    } catch (e) { }

    const adminEmail = "admin@example.com";
    const password = "Admin@Secured123!";

    await User.deleteOne({ email: adminEmail });

    await User.create({
        first_name: "System",
        last_name: "Admin",
        email: adminEmail,
        password: password,
        role: "admin",
        is_email_verified: true,
    });
    console.log(`Admin created: ${adminEmail} / ${password}`);

    await mongoose.disconnect();
};

seedAdmin();
