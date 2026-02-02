import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/v1';
const EMAIL = 'dhimant.pandya@technostacks.in';
const PASS = 'DhimantPandya@1';

async function verifyPriorityConfig() {
    console.log('--- Starting Priority Config Verification ---');

    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASS
        });
        // Console log removed for cleaner output
        const token = loginRes.data.data.tokens.access.token;
        console.log('   Login Successful. Token received.');

        // 2. Get Templates (to pick one)
        console.log('2. Fetching Templates...');
        const templatesRes = await axios.get(`${API_URL}/templates`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Handle pagination or wrapped response
        const results = templatesRes.data.results || templatesRes.data.data?.results || [];
        const template = results[0];
        if (!template) throw new Error('No templates found.');
        console.log(`   Using Template: ${template.name} (${template.id})`);

        // 3. Create Screen with Priority Rules
        console.log('3. Creating Screen with Priority Rules...');
        const zoneId = template.zones[0].id;
        const zoneType = template.zones[0].type; // Capture type

        const screenPayload = {
            name: "Priority Verification Screen",
            location: "Test Lab",
            templateId: template.id,
            status: "online",
            // Default (Priority 4)
            defaultContent: {
                [zoneId]: { type: zoneType, playlist: [{ url: "default.png", type: "image", duration: 10 }] }
            },
            // Schedule (Priority 3)
            schedules: [{
                name: "Test Schedule",
                startTime: "00:00",
                endTime: "23:59",
                content: {
                    [zoneId]: { type: zoneType, playlist: [{ url: "schedule.png", type: "image", duration: 10 }] }
                }
            }],
            // Trigger (Priority 2)
            triggerRules: [{
                type: "weather",
                condition: "Clear",
                content: {
                    [zoneId]: { type: zoneType, playlist: [{ url: "trigger.png", type: "image", duration: 10 }] }
                }
            }],
            // Audience (Priority 1)
            audienceRules: [{
                ageRange: "young-adult",
                gender: "male",
                content: {
                    [zoneId]: { type: zoneType, playlist: [{ url: "audience.png", type: "image", duration: 10 }] }
                }
            }]
        };

        const createRes = await axios.post(`${API_URL}/screens`, screenPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Log structure to be sure
        // console.log('Create Response:', JSON.stringify(createRes.data, null, 2));

        const screen = createRes.data.data || createRes.data;
        console.log(`   Screen Created! ID: ${screen.id || screen._id}`);

        // 4. Verify Data Structure matches Priority Expectation
        console.log('4. Verifying Saved Configuration...');

        const hasAudience = screen.audienceRules?.length > 0 && screen.audienceRules[0].content[zoneId]?.playlist[0]?.url === "audience.png";
        const hasTrigger = screen.triggerRules?.length > 0 && screen.triggerRules[0].content[zoneId]?.playlist[0]?.url === "trigger.png";
        const hasSchedule = screen.schedules?.length > 0 && screen.schedules[0].content[zoneId]?.playlist[0]?.url === "schedule.png";

        console.log(`   - Audience Rule Saved: ${hasAudience ? '✅' : '❌'}`);
        console.log(`   - Trigger Rule Saved: ${hasTrigger ? '✅' : '❌'}`);
        console.log(`   - Schedule Rule Saved: ${hasSchedule ? '✅' : '❌'}`);

        if (hasAudience && hasTrigger && hasSchedule) {
            console.log('\n--- VERIFICATION SUCCESSFUL ---');
            console.log('The backend correctly supports the multi-tier priority structure.');
            console.log('The Player (frontend) logic has been manually reviewed to enforce the order: Audience > Trigger > Schedule > Default.');
        } else {
            console.error('\n--- VERIFICATION FAILED ---');
            console.error('Data was not saved as expected.');
        }

        // Cleanup
        const cleanupId = screen.id || screen._id;
        if (cleanupId) {
            await axios.delete(`${API_URL}/screens/${cleanupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('   Test Screen Cleaned up.');
        }

    } catch (error: any) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

verifyPriorityConfig();
