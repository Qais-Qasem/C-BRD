const http = require('http');

http.get('http://0.0.0.0:3000/api/case-room/data/PRJ-324/MA-324-01?actingRole=SAMAR_CONSULTANT&channel=CLIENT_ENGAGEMENT', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('TIMINGS_RESULT:', JSON.stringify(parsed.timings));
      console.log('SUCCESS:', parsed.success);
      console.log('ERROR:', parsed.error);
    } catch (e) {
      console.log('Error parsing JSON:', data.substring(0, 200));
    }
  });
}).on('error', (e) => {
  console.log('Req error:', e);
});
