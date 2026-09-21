const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const db = new Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || "(default)"
});

async function run() {
  const vId = "09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2";
  const snap = await db.collection('canonical_source_snapshots').doc(vId).get();
  
  if (!snap.exists) {
    console.log("FAIL: Snapshot not found");
    return;
  }
  const data = snap.data();
  const blocks = data.preLlmBlocks || [];
  console.log(`SOURCE_VERSION_ID: ${vId}`);
  console.log(`BLOCK_COUNT: ${blocks.length}`);
  
  console.log("\n--- BLOCKS 25 to 55 ---");
  for (let i = 25; i <= 55; i++) {
    if (blocks[i]) {
      console.log(`[${i}] BlockId: ${blocks[i].blockId} Type: ${blocks[i].type}`);
      console.log(`Heading: ${blocks[i].headingContext}`);
      console.log(`Text: ${blocks[i].rawText}`);
      console.log("----");
    }
  }
}

run().catch(console.error);
