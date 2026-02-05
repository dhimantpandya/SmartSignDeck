const mongoose = require('mongoose');

async function checkScreenContent() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const s = await Screen.findById('698307ca8d6905b17602ac5d');

        console.log('--- SCREEN CONTENT CHECK ---');
        const content = s.defaultContent;
        for (const zoneId in content) {
            const z = content[zoneId];
            console.log(`Zone: ${zoneId}`);
            console.log(`  sourceType: ${z.sourceType}`);
            console.log(`  playlistId: ${z.playlistId}`);
            console.log(`  playlist (local) count: ${z.playlist ? z.playlist.length : 0}`);
            if (z.sourceType === 'playlist' && z.playlistId) {
                console.log(`  LINKED PLAYLIST FOUND: ${z.playlistId}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkScreenContent();
