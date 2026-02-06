
import axios from 'axios';

async function testLogin() {
    const email = 'dhimant.pandya@technostacks.in';
    const password = 'Password@123';
    const baseUrl = 'https://smart-sign-deck-backend.vercel.app'; // Based on ApiService fallback

    console.log(`Attempting login for ${email} at ${baseUrl}...`);

    try {
        const response = await axios.post(`${baseUrl}/v1/auth/login`, {
            email,
            password
        });

        console.log('Login Success!');
        console.log('Response status:', response.status);
        console.log('User ID:', response.data?.data?.user?.id || response.data?.data?.user?._id);
        console.log('Company ID:', response.data?.data?.user?.companyId);
    } catch (error: any) {
        console.error('Login Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testLogin();
