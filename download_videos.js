const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://mixkit.co/'
            }
        };

        https.get(url, options, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const videos = [
    { url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-connection-background-23058-large.mp4', dest: 'frontend/public/videos/hero.mp4' },
    { url: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-people-looking-at-a-digital-screen-large.mp4', dest: 'frontend/public/videos/solutions.mp4' }
];

async function main() {
    for (const video of videos) {
        console.log(`Downloading ${video.url}...`);
        try {
            await download(video.url, video.dest);
            console.log(`Saved to ${video.dest}`);
        } catch (err) {
            console.error(`Error downloading ${video.url}: ${err.message}`);
        }
    }
}

main();
