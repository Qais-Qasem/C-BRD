const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/module-study/synthesize-package',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});
req.write(JSON.stringify({
  projectId: 'PRJ-324',
  moduleId: 'MA-324-01'
}));
req.end();
