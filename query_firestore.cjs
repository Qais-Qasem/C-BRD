const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'c-bridge-regulatory-platform',
  databaseId: 'ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f',
});

async function run() {
  console.log("=== PROJECT INPUTS ===");
  const inputsSnap = await db.collection('project_inputs').where('projectId', '==', 'PRJ-324').where('type', '==', 'SYLLABUS').get();
  console.log("Syllabus inputs found:", inputsSnap.size);
  inputsSnap.forEach(doc => {
    console.log("Input ID:", doc.id);
  });

  console.log("\n=== CANONICAL SYLLABUS CURRENT ===");
  const curSnap = await db.collection('canonical_syllabus_current').doc('PRJ-324').get();
  if (curSnap.exists) {
    console.log("Current Canonical Source ID:", curSnap.data().currentSourceVersionId);
  } else {
    console.log("No current canonical syllabus found.");
  }

  console.log("\n=== CANONICAL SOURCE SNAPSHOTS ===");
  let versionId = null;
  const snapSnap = await db.collection('canonical_source_snapshots').where('projectId', '==', 'PRJ-324').get();
  console.log("Snapshots found:", snapSnap.size);
  snapSnap.forEach(doc => {
    const data = doc.data();
    console.log("Snapshot ID:", doc.id);
    console.log("Original Byte SHA-256:", data.originalByteSha256);
    console.log("Block Count:", data.blockCount);
    versionId = doc.id;
    
    // Print the first 50 blocks
    console.log("\n--- BLOCKS SAMPLE ---");
    const blocks = data.preLlmBlocks || [];
    blocks.forEach((b, i) => {
        if (b.rawText && b.rawText.trim().length > 0) {
            console.log(`[${i}] ${b.type}: ${b.rawText.substring(0, 100)}...`);
        }
    });
  });

  console.log("\n=== PROJECT PROPOSALS ===");
  const propSnap = await db.collection('project_proposals').where('projectId', '==', 'PRJ-324').get();
  propSnap.forEach(doc => {
    const data = doc.data();
    console.log("Proposal ID:", doc.id, "Title:", data.proposalSetTitle);
    console.log("Created At:", data.createdAt || "N/A");
    if (data.proposedItems) {
      data.proposedItems.forEach((item, idx) => {
        console.log(`  Item ${idx}: ${item.taskTitle || item.category}`);
      });
    }
  });
}

run().catch(console.error);
