
import mongoose from 'mongoose';
import config from './config/config';
import { Company } from './models';

async function dropIndex() {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    try {
        await Company.collection.dropIndex('name_1');
        console.log('Dropped name_1 index');
    } catch (error: any) {
        if (error.code === 27) {
            console.log('Index name_1 does not exist, skipping.');
        } else {
            console.error('Error dropping index:', error);
        }
    }

    await mongoose.disconnect();
}

dropIndex();
