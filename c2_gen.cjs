async function run() {
  console.log(`[${new Date().toISOString()}] Sending request to generate MA-324-01 requirements...`);
  try {
    const res = await fetch("http://localhost:3000/api/module-study/analyze-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "PRJ-324",
        moduleId: "MA-324-01"
      })
    });
    const data = await res.json();
    console.log(`[${new Date().toISOString()}] Response received.`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
