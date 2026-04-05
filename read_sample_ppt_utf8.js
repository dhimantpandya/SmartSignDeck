const officeParser = require('officeparser');
const fs = require('fs');

officeParser.parseOffice('Sample PPT.pptx', function(data, err) {
    if (err) return console.log(err);
    fs.writeFileSync('sample_ppt_text_utf8.txt', data, 'utf8');
    console.log("Written securely.");
});
