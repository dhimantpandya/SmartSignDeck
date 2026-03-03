const https = require('https');

function checkHealth() {
    https.get('https://smartsigndeck-api-v10.railway.app/health', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            const time = new Date().toLocaleTimeString();
            console.log(`[${time}] Status: ${res.statusCode} | Body: ${data.trim()}`);
            if (data.includes('v2-cors-fix-FINAL-999')) {
                console.log('\n=============================================');
                console.log('✅ SUCCESS: The old Railway project is now running the latest code!');
                console.log('=============================================\n');
                process.exit(0);
            } else {
                setTimeout(checkHealth, 10000);
            }
        });
    }).on('error', (err) => {
        console.error('Error:', err.message);
        setTimeout(checkHealth, 10000);
    });
}

console.log('Monitoring https://smartsigndeck-api-v10.railway.app/health ...');
console.log('Waiting for the version string to update to "v2-cors-fix-FINAL-999"');
checkHealth();
