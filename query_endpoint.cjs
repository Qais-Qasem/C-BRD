const http = require('http');

http.get('http://localhost:3000/api/module-study/canonical-bundle/PRJ-324/MA-324-01', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
