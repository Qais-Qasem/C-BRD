async function check() {
  const res = await fetch('http://localhost:3000/api/module-study/readiness/PRJ-324/MA-324-01?caseId=CASE-LEVANT-01');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check();
