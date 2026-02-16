import mongoose from "mongoose";
import config from "./src/config/config";
import Company from "./src/models/company.model";
import User from "./src/models/user.model";
import { Message } from "./src/models/social.model";
import Template from "./src/models/template.model";
import Screen from "./src/models/screen.model";
import Playlist from "./src/models/playlist.model";

const mergeCompanies = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        console.log("Connected to MongoDB:", config.mongoose.dbName);

        const companies = await Company.find({});
        console.log(`Total companies: ${companies.length}`);

        const nameMap: Record<string, any> = {}; // normalized name -> master company
        const duplicates: any[] = [];

        // 1. Lowercase all names and find duplicates
        for (const company of companies) {
            const normalizedName = company.name.toLowerCase().trim();
            if (!nameMap[normalizedName]) {
                nameMap[normalizedName] = company;
                if (company.name !== normalizedName) {
                    company.name = normalizedName;
                    await company.save();
                    console.log(`Normalized name for ${company._id}: ${normalizedName}`);
                }
            } else {
                duplicates.push(company);
            }
        }

        console.log(`Found ${duplicates.length} duplicate companies to merge.`);

        // 2. Merge duplicates
        for (const duplicate of duplicates) {
            const normalizedName = duplicate.name.toLowerCase().trim();
            const master = nameMap[normalizedName];

            console.log(`Merging "${duplicate.name}" (${duplicate._id}) -> into -> "${master.name}" (${master._id})`);

            // Update Users
            await User.updateMany({ companyId: duplicate._id }, { companyId: master._id, companyName: master.name });

            // Update Messages
            await Message.updateMany({ companyId: duplicate._id }, { companyId: master._id });

            // Update Templates
            await Template.updateMany({ companyId: duplicate._id }, { companyId: master._id });

            // Update Screens
            await Screen.updateMany({ companyId: duplicate._id }, { companyId: master._id });

            // Update Playlists
            await Playlist.updateMany({ companyId: duplicate._id }, { companyId: master._id });

            // Delete the duplicate
            await Company.deleteOne({ _id: duplicate._id });
        }

        // 3. Re-link orphaned Messages
        const orphanedMessages = await Message.find({ companyId: { $exists: false } });
        console.log(`Found ${orphanedMessages.length} orphaned messages.`);

        for (const msg of orphanedMessages) {
            const sender = await User.findById(msg.senderId);
            if (sender && sender.companyId) {
                msg.companyId = sender.companyId;
                await msg.save();
                console.log(`Linked orphaned message ${msg._id} to company ${sender.companyId}`);
            }
        }

        console.log("\nMigration completed successfully.");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

mergeCompanies();
