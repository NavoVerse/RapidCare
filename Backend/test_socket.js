const io = require('socket.io-client');
const fetch = require('node-fetch');

const socket = io('http://localhost:5000');
socket.on('connect', () => {
    console.log('Connected to socket, ID:', socket.id);
    socket.emit('join', { userId: 1, role: 'driver' });
    console.log('Sent join event for driver_1');
    
    // Now trigger the request API
    setTimeout(async () => {
        try {
            // Get patient token
            const resLogin = await fetch('http://localhost:5000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'somim69bhatari@gmail.com', password: 'password123', expectedRole: 'patient' })
            });
            const dataLogin = await resLogin.json();
            
            console.log('Triggering trip request...');
            const resReq = await fetch('http://localhost:5000/api/v1/trips/request', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${dataLogin.token}`
                },
                body: JSON.stringify({
                    pickup_lat: 22.57,
                    pickup_lng: 88.36,
                    hospital_id: '1'
                })
            });
            const dataReq = await resReq.json();
            console.log('Trip request response:', resReq.status, dataReq);
        } catch(e) {
            console.error('Error triggering request:', e);
        }
    }, 1000);
});

socket.on('trip:new_request', (data) => {
    console.log('✅ RECEIVED trip:new_request!', data);
    process.exit(0);
});

setTimeout(() => {
    console.log('❌ Timeout waiting for trip:new_request');
    process.exit(1);
}, 5000);
