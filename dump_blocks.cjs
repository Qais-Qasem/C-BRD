const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });
async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  const blocks = doc.data().preLlmBlocks;
  console.log("BLOCK 29:\n" + blocks[29].rawText);
  console.log("\nBLOCK 40:\n" + blocks[39].rawText);
}
run();
