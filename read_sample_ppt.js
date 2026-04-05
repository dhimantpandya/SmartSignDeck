const officeParser = require('officeparser');

officeParser.parseOffice('Sample PPT.pptx', function(data, err) {
    if (err) return console.log(err);
    console.log(data);
});
