const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('Dhimant Pandya 65 Word Sem6.pdf');

pdf(dataBuffer).then(function(data) {
    let text = data.text;
    let lines = text.split('\n');
    let layoutIndex = lines.findIndex(l => l.toLowerCase().includes('screen layout'));
    
    if (layoutIndex !== -1) {
        console.log("Found 'Screen Layout' around line:", layoutIndex);
        let snippet = lines.slice(Math.max(0, layoutIndex - 5), Math.min(lines.length, layoutIndex + 50)).join('\n');
        console.log(snippet);
    } else {
        console.log("Could not find 'Screen Layout' text.");
    }
}).catch(console.error);
