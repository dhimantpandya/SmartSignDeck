
import mongoose from "mongoose";
import { Template } from "./models";
import config from "./config/config";

async function run() {
    await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
    console.log("Connected to DB");

    const templates = await Template.find({})
        .populate({ path: "createdBy", select: "id _id first_name last_name email avatar" })
        .limit(1);

    console.log("Found templates:", templates.length);
    if (templates.length > 0) {
        const t = templates[0];
        console.log("Template ID:", t.id);
        console.log("Template CreatedBy:", JSON.stringify(t.createdBy, null, 2));

        // Check toJSON output
        console.log("toJSON Output:", JSON.stringify(t.toJSON(), null, 2));
    }

    await mongoose.disconnect();
}

run().catch(console.error);
