const fs = require('fs');
const path = require('path');

const slideDir = path.join(__dirname, 'sample_ppt_extracted', 'ppt', 'slides');

if (fs.existsSync(slideDir)) {
    const files = fs.readdirSync(slideDir).filter(f => f.endsWith('.xml'));
    files.sort((a,b) => {
        const numA = parseInt(a.match(/slide(\d+)/)[1]);
        const numB = parseInt(b.match(/slide(\d+)/)[1]);
        return numA - numB;
    });

    files.forEach(file => {
        const content = fs.readFileSync(path.join(slideDir, file), 'utf8');
        const matches = [...content.matchAll(/<a:t>([^<]*)<\/a:t>/g)];
        const text = matches.map(m => m[1]).join(' ');
        if (text.trim()) {
            console.log(`\n--- ${file} ---`);
            console.log(text);
        }
    });
} else {
    console.log("Slide directory not found.");
}
