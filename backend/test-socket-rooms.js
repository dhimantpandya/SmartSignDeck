/**
 * Quick diagnostic script to test company chat socket rooms
 * Run this to check if users are in the same room
 */

const io = require('socket.io-client');

// Connect two clients
const client1 = io('http://localhost:5000', {
    transports: ['websocket']
});

const client2 = io('http://localhost:5000', {
    transports: ['websocket']
});

// Test company ID (replace with actual company ID from your database)
const testCompanyId = '507f1f77bcf86cd799439011'; // Example ObjectId

client1.on('connect', () => {
    console.log('[Client 1] Connected:', client1.id);
    client1.emit('join_company', testCompanyId);
});

client1.on('room_joined', (data) => {
    console.log('[Client 1] Room joined:', data);
});

client1.on('new_chat', (data) => {
    console.log('[Client 1] Received message:', data);
});

client2.on('connect', () => {
    console.log('[Client 2] Connected:', client2.id);
    client2.emit('join_company', testCompanyId);
});

client2.on('room_joined', (data) => {
    console.log('[Client 2] Room joined:', data);

    // After both joined, send a test message
    setTimeout(() => {
        console.log('[Client 2] Sending test message...');
        // This would normally go through your API
        // For now, just check if rooms are joined correctly
    }, 1000);
});

client2.on('new_chat', (data) => {
    console.log('[Client 2] Received message:', data);
});

setTimeout(() => {
    console.log('\n=== Test Complete ===');
    client1.disconnect();
    client2.disconnect();
    process.exit(0);
}, 5000);
