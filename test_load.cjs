const http = require('http');

http.get('http://0.0.0.0:3000/api/case-room/data/PRJ-324/MA-324-01?actingRole=SAMAR_CONSULTANT&channel=CLIENT_ENGAGEMENT', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Success:', parsed.success);
      console.log('Session ID:', parsed.activeSessionId);
      console.log('Messages count:', parsed.messages?.length);
      console.log('Timings:', parsed.timings);
    } catch (e) {
      console.log('Error parsing:', data);
    }
  });
}).on('error', (e) => {
  console.log('Req error:', e);
});
