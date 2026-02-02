
import mongoose from 'mongoose';
import config from '../src/config/config';
import Screen from '../src/models/screen.model';
import logger from '../src/config/logger';

const run = async () => {
    try {
        await mongoose.connect(config.mongoose.url, { dbName: config.mongoose.dbName });
        logger.info('Connected to MongoDB');

        const count = await Screen.countDocuments();
        const screens = await Screen.find({}).limit(5);

        console.log(`Total Screens: ${count}`);
        console.log('Sample Screens:', JSON.stringify(screens, null, 2));

    } catch (error) {
        logger.error('Error', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
