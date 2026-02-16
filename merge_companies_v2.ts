
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

// Define minimal schemas to avoid loading full models and triggers
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
    const url = process.env.MONGO_DB_URL || 'mongodb://localhost:27017';
    const dbName = process.env.MONGO_DB_NAME || 'smartsigndeck';

    console.log(`Connecting to ${url} / ${dbName}...`);
    await mongoose.connect(url, { dbName });
    console.log('Connected.');

    // 1. Fetch all companies
    const companies = await Company.find({});
    console.log(`Found ${companies.length} total companies.`);

    // 2. Group by normalized name
    const groups: Record<string, any[]> = {};

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
            // If timestamps not available, use _id (roughly matches time)
            group.sort((a, b) => {
                const tA = (a as any).createdAt || a._id.getTimestamp();
                const tB = (b as any).createdAt || b._id.getTimestamp();
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
