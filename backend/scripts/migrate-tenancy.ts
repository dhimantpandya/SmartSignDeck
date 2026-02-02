import mongoose from "mongoose";
import config from "../src/config/config";
import { User, Company, Template, Screen } from "../src/models";

const migrate = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        console.log("Connected to MongoDB for migration...");

        // 1. Find all users
        const users = await User.find({});
        console.log(`Found ${users.length} users...`);

        if (users.length === 0) {
            console.log("No users found. Nothing to migrate.");
            process.exit(0);
        }

        const companyMap = new Map();

        // 2. Create companies for each unique name
        for (const user of users) {
            // Access raw doc for legacy fields
            const rawUser = user.toObject({ virtuals: false });
            const legacyName = (rawUser as any).companyName || "Default Company";

            if (!companyMap.has(legacyName)) {
                let company = await Company.findOne({ name: legacyName });
                if (!company) {
                    company = await Company.create({
                        name: legacyName,
                        ownerId: user._id,
                        description: `Migrated from legacy company name: ${legacyName}`
                    });
                    console.log(`Created company: ${legacyName}`);
                }
                companyMap.set(legacyName, company._id);
            }

            const companyId = companyMap.get(legacyName);

            // Update User
            user.companyId = companyId;
            // Ensure valid role
            if (!["user", "admin", "super_admin"].includes(user.role)) {
                user.role = "user";
            }
            await user.save();
        }

        // 3. Update Templates
        const templates = await Template.find({ companyId: { $exists: false } });
        console.log(`Updating ${templates.length} templates...`);
        for (const template of templates) {
            const rawTemplate = template.toObject({ virtuals: false });
            const creatorId = (rawTemplate as any).createdBy || users[0]._id;
            const owner = await User.findById(creatorId) || users[0];

            template.companyId = owner.companyId!;
            template.createdBy = owner._id as any;
            await template.save();
        }

        // 4. Update Screens
        const screens = await Screen.find({ companyId: { $exists: false } });
        console.log(`Updating ${screens.length} screens...`);
        for (const screen of screens) {
            const rawScreen = screen.toObject({ virtuals: false });
            const creatorId = (rawScreen as any).createdBy || users[0]._id;
            const owner = await User.findById(creatorId) || users[0];

            screen.companyId = owner.companyId!;
            screen.createdBy = owner._id as any;
            await screen.save();
        }

        console.log("Migration successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
