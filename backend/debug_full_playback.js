const mongoose = require('mongoose');

async function debugFull() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Screen = mongoose.model('Screen', new mongoose.Schema({}, { strict: false }));
        const Playlist = mongoose.model('Playlist', new mongoose.Schema({}, { strict: false }));

        const screenId = '698307ca8d6905b17602ac5d';
        const s = await Screen.findById(screenId);

        console.log(`--- DEBUGGING SCREEN ${screenId} ---`);
        console.log(`Name: ${s.name}`);

        const content = s.defaultContent;
        for (const zoneId in content) {
            const z = content[zoneId];
            console.log(`\nZone: ${zoneId}`);
            console.log(`  Source: ${z.sourceType}`);
            console.log(`  PlaylistID: ${z.playlistId}`);

            if (z.sourceType === 'playlist' && z.playlistId) {
                const p = await Playlist.findById(z.playlistId);
                if (p) {
                    console.log(`  PLAYLIST FOUND: ${p.name}`);
                    console.log(`  Item Count: ${p.items ? p.items.length : 0}`);
                    if (p.items) {
                        p.items.forEach(item => console.log(`    - ${item.type}: ${item.url}`));
                    }
                } else {
                    console.log(`  PLAYLIST NOT FOUND IN DB: ${z.playlistId}`);
                }
            } else if (z.playlist && z.playlist.length > 0) {
                console.log(`  LOCAL PLAYLIST: ${z.playlist.length} items`);
                z.playlist.forEach(item => console.log(`    - ${item.type}: ${item.url}`));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugFull();
