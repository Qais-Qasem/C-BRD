const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'c-bridge-regulatory-platform',
  databaseId: 'ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f',
});

async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  if (doc.exists) {
    const data = doc.data();
    const blocks = data.preLlmBlocks || [];
    console.log("=== BLOCK 29 ===");
    console.log(blocks[29] ? blocks[29].rawText : 'Not found');
    console.log("\n=== BLOCK 39 ===");
    console.log(blocks[39] ? blocks[39].rawText : 'Not found');
  }

  console.log("\n=== PROJECT PROPOSALS ===");
  const propSnap = await db.collection('project_proposals').where('projectId', '==', 'PRJ-324').get();
  propSnap.forEach(doc => {
    const data = doc.data();
    console.log("Proposal ID:", doc.id, "Title:", data.proposalSetTitle);
    console.log("Created At:", data.createdAt);
    if (data.proposedItems) {
      data.proposedItems.forEach((item, idx) => {
        console.log(`  Item ${idx}: ${item.taskTitle} - ${item.modulePurpose || item.objective}`);
      });
    }
  });
}

run().catch(console.error);
