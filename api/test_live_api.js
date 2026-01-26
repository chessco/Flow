const axios = require('axios');

async function testNullResponse() {
    try {
        const res = await axios.get('https://flow-api.pitayacode.io/kanban', {
            headers: {
                'x-tenant-id': 'edd1ac37-5ff9-4e46-bc7f-fff3c414d718'
            }
        });
        console.log('Status:', res.status);
        console.log('Data Type:', typeof res.data);
        console.log('Data:', res.data);
    } catch (err) {
        if (err.response) {
            console.log('Error Status:', err.response.status);
            console.log('Error Data:', err.response.data);
        } else {
            console.log('Error:', err.message);
        }
    }
}

testNullResponse();
