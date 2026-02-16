import mongoose from "mongoose";
import config from "./src/config/config";
import Company from "./src/models/company.model";
import User from "./src/models/user.model";

import fs from "fs";

const checkCompanies = async () => {
    let output = "";
    const log = (msg: string) => {
        console.log(msg);
        output += msg + "\n";
    };

    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        log("Connected to MongoDB: " + config.mongoose.dbName);

        const companies = await Company.find({});
        log(`Total companies in collection: ${companies.length}`);

        const users = await User.find({}).populate('companyId');
        log(`Total users: ${users.length}`);

        const userGroups: Record<string, string[]> = {};
        users.forEach(u => {
            const name = (u.companyName || "No Name").trim().toLowerCase();
            if (!userGroups[name]) userGroups[name] = [];
            const companyIdText = u.companyId ? (u.companyId as any)._id?.toString() || u.companyId.toString() : "None";
            userGroups[name].push(`${u.email} (ID: ${companyIdText})`);
        });

        log("\n--- User Grouping by Normalized Company Name ---");
        for (const name in userGroups) {
            log(`\nGroup: "${name}"`);
            userGroups[name].forEach(info => log(`  - ${info}`));
        }

        const nameGroups: Record<string, any[]> = {};
        companies.forEach(c => {
            const normalized = c.name.trim().toLowerCase();
            if (!nameGroups[normalized]) nameGroups[normalized] = [];
            nameGroups[normalized].push(c);
        });

        log("\n--- Company Name Groups (Case-Insensitive) ---");
        for (const name in nameGroups) {
            if (nameGroups[name].length > 1) {
                log(`\nGroup: "${name}" (${nameGroups[name].length} duplicates)`);
                for (const c of nameGroups[name]) {
                    const userCount = await User.countDocuments({ companyId: c._id });
                    log(`  - ID: ${c._id}, Original Name: "${c.name}", Users: ${userCount}`);
                }
            } else {
                log(`\nGroup: "${name}" (1 instance)`);
                const c = nameGroups[name][0];
                const userCount = await User.countDocuments({ companyId: c._id });
                log(`  - ID: ${c._id}, Original Name: "${c.name}", Users: ${userCount}`);
            }
        }

        const messages = await (await import("./src/models/social.model")).Message.find({});
        log(`Total messages: ${messages.length}`);

        const companyMessages: Record<string, number> = {};
        messages.forEach(m => {
            const cid = m.companyId?.toString() || "No Company";
            companyMessages[cid] = (companyMessages[cid] || 0) + 1;
        });

        log("\n--- Message Count by CompanyID ---");
        for (const cid in companyMessages) {
            const company = companies.find(c => c._id.toString() === cid);
            const name = company ? company.name : (cid === "No Company" ? "None" : "Unknown Company");
            log(`  - CompanyID: ${cid} (${name}): ${companyMessages[cid]} messages`);
        }

        fs.writeFileSync("diagnostic_results.txt", output);
        await mongoose.disconnect();
        log("\nDisconnected from MongoDB");
    } catch (error) {
        console.error("Error:", error);
    }
};

checkCompanies();
