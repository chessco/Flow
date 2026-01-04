const http = require('http');

const data = JSON.stringify({
    apiKey: 'test-key',
    provider: 'GEMINI',
    mode: 'TENANT'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/ai/config',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'test-tenant',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY: ' + body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
