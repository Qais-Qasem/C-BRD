async function check() {
  const fetch = require('node-fetch'); // actually not needed if global works, let's just use global
  const res = await fetch('http://localhost:3000/api/module-study/readiness/PRJ-324/MA-324-01');
  const d = await res.json();
  console.log(d);
}
check();
