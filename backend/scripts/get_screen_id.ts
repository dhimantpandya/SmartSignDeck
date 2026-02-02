import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/v1';
const EMAIL = 'dhimant.pandya@technostacks.in';
const PASS = 'DhimantPandya@1';

async function getScreenId() {
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASS
        });
        const token = loginRes.data.data.tokens.access.token;

        const screensRes = await axios.get(`${API_URL}/screens`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const screens = screensRes.data.results || screensRes.data.data?.results || [];
        if (screens.length > 0) {
            console.log(`SCREEN_ID:${screens[0].id || screens[0]._id}`);
        } else {
            console.log('NO_SCREENS_FOUND');
        }
    } catch (error) {
        console.error('Error fetching screen:', error);
    }
}

getScreenId();
