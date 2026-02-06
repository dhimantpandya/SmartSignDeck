import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";
import User from "./src/models/user.model";

dotenv.config({ path: path.join(__dirname, ".env") });

const mongoUrl = process.env.MONGO_DB_URL;
const dbName = process.env.MONGO_DB_NAME;

if (!mongoUrl || !dbName) {
    process.exit(1);
}

const fullUrl = mongoUrl.includes('?')
    ? mongoUrl.replace('?', `/${dbName}?`)
    : (mongoUrl.endsWith('/') ? `${mongoUrl}${dbName}` : `${mongoUrl}/${dbName}`);

const listData = async () => {
    try {
        await mongoose.connect(fullUrl);
        const users = await User.find({});
        console.log("--- User List ---");
        users.forEach(u => {
            console.log(`Email: ${u.email}, First: [${u.first_name}], Last: [${u.last_name}], Onboarding: ${u.onboardingCompleted}, Company: ${u.companyId}`);
        });
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

listData();
