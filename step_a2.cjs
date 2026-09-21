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
  
  const blocks = snap.data().preLlmBlocks || [];
  const b29 = blocks[29];
  const b39 = blocks[39];
  
  console.log("=== BLOCK 29 SCHEMA ===");
  console.log(JSON.stringify(b29, null, 2));
  
  console.log("\n=== BLOCK 39 SCHEMA ===");
  console.log(JSON.stringify(b39, null, 2));
}

run().catch(console.error);
