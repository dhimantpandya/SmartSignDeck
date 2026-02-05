// Test script to verify user update with role field
const axios = require('axios');

async function testUserUpdate() {
    try {
        // You'll need to replace these with actual values
        const userId = 'USER_ID_HERE'; // Replace with actual user ID
        const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual JWT token

        const response = await axios.patch(
            `http://localhost:3000/v1/users/${userId}`,
            { role: 'admin' },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testUserUpdate();
