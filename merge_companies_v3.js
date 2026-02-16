
const path = require('path');
// Try to require mongoose from backend node_modules
let mongoose;
try {
    mongoose = require('./backend/node_modules/mongoose');
} catch (e) {
    try {
        mongoose = require('mongoose');
    } catch (e2) {
        console.error('Cannot find mongoose. Please run from root or install mongoose.');
        process.exit(1);
    }
}

// Define minimal schemas
const companySchema = new mongoose.Schema({
    name: String,
    email: String,
    ownerId: mongoose.Schema.Types.ObjectId,
    isActive: Boolean
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    email: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyName: String,
    role: String
});

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);

async function mergeCompanies() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'smartsigndeck';

    console.log(`Connecting to ${url} / ${dbName}...`);
    await mongoose.connect(url, { dbName });
    console.log('Connected.');

    // 1. Fetch all companies
    const companies = await Company.find({});
    console.log(`Found ${companies.length} total companies.`);

    // 2. Group by normalized name
    const groups = {};

    for (const c of companies) {
        const norm = (c.name || '').trim().toLowerCase();
        if (!norm) continue;
        if (!groups[norm]) groups[norm] = [];
        groups[norm].push(c);
    }

    // 3. Process groups with duplicates
    for (const name in groups) {
        const group = groups[name];
        if (group.length > 1) {
            console.log(`\nFound ${group.length} duplicates for "${name}":`);

            // Sort by creation time (oldest first)
            group.sort((a, b) => {
                const tA = (a.createdAt) ? new Date(a.createdAt).getTime() : a._id.getTimestamp().getTime();
                const tB = (b.createdAt) ? new Date(b.createdAt).getTime() : b._id.getTimestamp().getTime();
                return tA - tB;
            });

            // Keep the oldest one as MASTER
            const master = group[0];
            const duplicates = group.slice(1);

            console.log(`  Keeping MASTER: ${master._id} (${master.name})`);

            for (const dup of duplicates) {
                console.log(`  Merging DUPLICATE: ${dup._id} (${dup.name}) -> ${master._id}`);

                // Update all users pointing to duplicate
                const result = await User.updateMany(
                    { companyId: dup._id },
                    {
                        $set: {
                            companyId: master._id,
                            companyName: master.name // Ensure consistent casing
                        }
                    }
                );
                console.log(`    Updated ${result.modifiedCount} usage(s) of duplicates.`);

                // Delete duplicate company
                await Company.deleteOne({ _id: dup._id });
                console.log(`    Deleted duplicate company ${dup._id}.`);
            }
        }
    }

    console.log('\n--- VERIFICATION ---');
    const dhimantUsers = await User.find({ email: { $regex: /dhimant/i } });
    dhimantUsers.forEach(u => {
        console.log(`User: ${u.email} -> Company: ${u.companyId} (${u.companyName})`);
    });

    await mongoose.disconnect();
    console.log('Done.');
}

mergeCompanies().catch(err => {
    console.error(err);
    process.exit(1);
});
