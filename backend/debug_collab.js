const mongoose = require("mongoose");
const fs = require("fs");

const dbUrl = "mongodb://localhost:27017/smartsigndeck";

async function run() {
    await mongoose.connect(dbUrl);
    let output = "Connected to DB\n";

    const requests = await mongoose.connection.db.collection("collaborationrequests").find({}).toArray();
    output += "Collaboration requests:\n";
    for (let r of requests) {
        output += (`- Request ${r._id}: sender=${r.sender}, recipient=${r.recipient}, templateId=${r.templateId}, status=${r.status}\n`);
    }

    const users = await mongoose.connection.db.collection("users").find({
        first_name: "Dhimant"
    }).toArray();

    output += ("\nUsers named Dhimant:\n");
    for (let u of users) {
        output += (`- User ${u._id}: email=${u.email}\n`);
    }

    fs.writeFileSync("collab_out.txt", output, "utf-8");
    mongoose.disconnect();
}

run().catch(console.error);
