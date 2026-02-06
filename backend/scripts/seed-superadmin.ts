import mongoose from "mongoose";
import User from "../src/models/user.model";
import Company from "../src/models/company.model";
import config from "../src/config/config";

const seedSuperAdmin = async () => {
  await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
  console.log("Connected to MongoDB");

  const email = "smartsigndeck@gmail.com";
  const password = "SmartSignDeck@2025";
  const companyName = "SmartSignDeck";

  try {
    // 1. Ensure super admin user exists
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        first_name: "SmartSignDeck",
        last_name: "Owner",
        email,
        password,
        role: "super_admin",
        is_email_verified: true,
        onboardingCompleted: false,
      });
      console.log(`Super admin user created: ${email}`);
    } else if (user.role !== "super_admin") {
      user.role = "super_admin";
      await user.save();
      console.log(`Existing user ${email} promoted to super_admin`);
    } else {
      console.log(`Super admin user already exists: ${email}`);
    }

    // 2. Ensure default SmartSignDeck company exists and is linked
    let company = await Company.findOne({ name: companyName });
    if (!company) {
      company = await Company.create({
        name: companyName,
        ownerId: user._id,
      } as any);
      console.log(`Company created: ${companyName}`);
    }

    if (!user.companyId || user.companyId.toString() !== company._id.toString()) {
      user.companyId = company._id;
      user.companyName = company.name;
      user.onboardingCompleted = true;
      await user.save();
      console.log(`Linked super admin to company ${companyName}`);
    }

    console.log("\nDefault super_admin seeded:");
    console.log(`Email   : ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Company : ${companyName}`);
  } catch (error) {
    console.error("Error seeding super_admin:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedSuperAdmin();

