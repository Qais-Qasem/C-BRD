const fetch = require('node-fetch'); // wait I can use fetch directly in node v22
async function check() {
  const res = await fetch('http://localhost:3000/api/module-study/readiness/PRJ-324/MA-324-01');
}
// I will edit server.ts to return the matching doc
