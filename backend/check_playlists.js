const mongoose = require('mongoose');

async function checkPlaylists() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartsigndeck');
        const Playlist = mongoose.model('Playlist', new mongoose.Schema({}, { strict: false }));

        const playlists = await Playlist.find({});
        console.log(`TOTAL PLAYLISTS: ${playlists.length}`);

        for (const p of playlists) {
            console.log('-------------------');
            console.log(`Name: ${p.name}`);
            console.log(`ID: ${p._id}`);
            console.log(`Company: ${p.companyId}`);
            console.log(`Items: ${p.items ? p.items.length : 0}`);
            if (p.items && p.items.length > 0) {
                p.items.forEach((item, i) => {
                    console.log(`  [${i}] ${item.type}: ${item.url}`);
                });
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPlaylists();
