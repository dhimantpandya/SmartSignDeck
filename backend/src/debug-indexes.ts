
import mongoose from 'mongoose';
import config from './config/config';
import { Company } from './models';

async function main() {
    console.log('Connecting to:', config.mongoose.url);
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected.');

    try {
        const indexes = await Company.collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        const exists = indexes.some(idx => idx.name === 'name_1');
        if (exists) {
            console.log('Index name_1 found. Dropping...');
            await Company.collection.dropIndex('name_1');
            console.log('Index dropped successfully.');
        } else {
            console.log('Index name_1 NOT found.');
        }

        const newIndexes = await Company.collection.indexes();
        console.log('Indexes AFTER drop:', JSON.stringify(newIndexes, null, 2));

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

main();
