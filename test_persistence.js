async function runTest() {
  console.log("A. Writing test message...");
  try {
    const res = await fetch('http://localhost:3001/api/case-room/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: "ROOM-PRJ-324-MA-324-01",
        channel: "INTERNAL_CBRIDGE",
        text: "Persistence test 001",
        actingRole: "SAMAR_CONSULTANT",
        projectId: "PRJ-324",
        moduleId: "MA-324-01",
        caseId: "CASE-LEVANT-01",
        sessionId: "SESS-CASE-LEVANT-01-PILOT-V1"
      })
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
  } catch(e) {
    console.error("Test failed:", e);
  }
}
runTest();
