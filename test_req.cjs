async function check() {
  const res = await fetch('http://localhost:3000/api/module-study/requirements-map/PRJ-324/MA-324-01');
  const data = await res.json();
  const map = data.requirementsMap;
  map.requirements.forEach(r => console.log(r.id, r.reviewStatus));
  console.log("Map status:", map.status);
}
check();
