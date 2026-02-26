import mongoose from 'mongoose';
import Company from '../models/company.model';
import User from '../models/user.model';
import config from '../config/config';

async function fixCompanies() {
    console.log('Connecting to MongoDB at:', config.mongoose.url, 'DB:', config.mongoose.dbName);
    await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
  
    // Debug: List collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  
    const userCount = await User.countDocuments();
    console.log('Total Users in DB:', userCount);
  
    const companyCount = await Company.countDocuments();
    console.log('Total Companies in DB:', companyCount);
    console.log('Connected.');

    // 1. Normalize all Company names to lowercase
    const companies = await Company.find();
    console.log(`Found ${companies.length} company records.`);

    const companyMap = new Map(); // name -> canonical record

    for (const company of companies) {
        const normalizedName = company.name.trim().toLowerCase();

        if (!companyMap.has(normalizedName)) {
            // First time seeing this name, make it canonical
            company.name = normalizedName;
            await company.save();
            companyMap.set(normalizedName, company);
            console.log(`Normalized: "${normalizedName}" (ID: ${company._id})`);
        } else {
            // Duplicate found!
            const canonical = companyMap.get(normalizedName);
            console.log(`Duplicate found for "${normalizedName}": ${company._id} -> merging into ${canonical._id}`);

            // Update all users linked to this duplicate
            const updateRes = await User.updateMany(
                { companyId: company._id },
                { companyId: canonical._id, companyName: canonical.name }
            );
            console.log(`Updated ${updateRes.modifiedCount} users to canonical company.`);

            // Delete the duplicate company record
            await Company.findByIdAndDelete(company._id);
            console.log(`Deleted duplicate record: ${company._id}`);
        }
    }

    // 2. Link users with companyName but NO companyId (Shadow Organizations)
    const orphanedUsers = await User.find({
        companyName: { $exists: true, $ne: '' },
        companyId: { $exists: false }
    });

    console.log(`Found ${orphanedUsers.length} users with companyName but no companyId.`);
  if (orphanedUsers.length > 0) {
    console.log('First few orphaned users:', orphanedUsers.slice(0, 3).map(u => ({ email: u.email, companyName: u.companyName })));
  }

    for (const user of orphanedUsers) {
        if (!user.companyName) continue;
        const normalizedName = user.companyName.trim().toLowerCase();
        let company = await Company.findOne({ name: normalizedName });

        if (!company) {
            // Create new company if it doesn't exist at all (e.g., "abc")
            company = await Company.create({
                name: normalizedName,
                ownerId: user._id,
                isActive: true
            });
            console.log(`Created new company record for orphaned user: "${normalizedName}" (ID: ${company._id})`);
        }

        user.companyId = company._id;
        user.companyName = company.name;
        await user.save();
        console.log(`Linked user ${user.email} to company: "${normalizedName}"`);
    }

    // 3. Final consistency check: update companyName for all users to match canonical casing
    const allUsers = await User.find({ companyId: { $exists: true } });
    for (const user of allUsers) {
        const company = await Company.findById(user.companyId);
        if (company && user.companyName !== company.name) {
            user.companyName = company.name;
            await user.save();
        }
    }

    console.log('Data cleanup completed successfully.');
    await mongoose.disconnect();
}

fixCompanies().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
