const axios = require('axios');

async function debugProduction() {
    try {
        const baseURL = 'https://smart-sign-deck.onrender.com/v1';

        // 1. Login to get token
        console.log('Logging in...');
        const authRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'dhimantpandya6@gmail.com', // Using standard testing account
            password: 'password123' // assuming standard password, if it fails we can catch
        });

        const token = authRes.data.tokens.access.token;
        const myId = authRes.data.user.id;
        console.log('Logged in as', authRes.data.user.email, myId);

        // 2. Fetch collaboration requests (all outgoing)
        console.log('Fetching outgoing requests...');
        const reqsRes = await axios.get(`${baseURL}/collaboration-requests?type=outgoing&status=pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('All Outgoing Pending Requests:');
        console.log(JSON.stringify(reqsRes.data, null, 2));

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

debugProduction();
