const axios = require('axios');

async function checkOldApi() {
    console.log("Testing connection to old API...");

    // 1. Check health
    try {
        const health = await axios.get('https://smartsigndeck-api-v10.railway.app/v1/health');
        console.log("Health OK:", health.data);
    } catch (e) {
        console.error("Health fail:", e.message);
    }

    // 2. Try to cause a debug error to leak DB connection string (if any error handlers are loose)
    try {
        console.log("Triggering error...");
        const errReq = await axios.post('https://smartsigndeck-api-v10.railway.app/v1/auth/register', {
            first_name: "test",
            email: "invalid_email_no_domain"
        });
        console.log("Error trigger response:", errReq.data);
    } catch (e) {
        console.log("Error trigger failed (expected):", e.response ? e.response.data : e.message);
    }

    // 3. Try to login with smartsigndeck@gmail.com using some common admin passwords
    // Note: The previous seeder uses smartsigndeck@gmail.com and Admin@123
    try {
        console.log("Attempting to login as admin...");
        const login = await axios.post('https://smartsigndeck-api-v10.railway.app/v1/auth/login', {
            email: 'smartsigndeck@gmail.com',
            password: 'Admin@123' // default password from seed.service.ts
        });
        console.log("Login SUCCESS!");

        const token = login.data.tokens.access.token;

        console.log("Fetching templates...");
        const templates = await axios.get('https://smartsigndeck-api-v10.railway.app/v1/templates', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Found ${templates.data.results ? templates.data.results.length : 0} templates`);

    } catch (e) {
        console.error("Login attempt failed:", e.response ? e.response.data : e.message);
    }
}

checkOldApi();
