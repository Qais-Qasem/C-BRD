const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const db = new Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || "(default)"
});

async function run() {
  const vId = "09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2";
  const snap = await db.collection('canonical_source_snapshots').doc(vId).get();
  
  const blocks = snap.data().preLlmBlocks || [];
  
  console.log("\n--- BLOCKS 25 to 40 ---");
  for (let i = 25; i <= 40; i++) {
    if (blocks[i]) {
      console.log(`\n[${i}] BlockId: ${blocks[i].blockId} Type: ${blocks[i].type}`);
      if (blocks[i].type === 'table') {
         console.log("Table structure detected. Truncating for display:");
         console.log(blocks[i].rawText.substring(0, 500) + "...");
      } else {
         console.log(`Text: ${blocks[i].rawText}`);
      }
    }
  }
}

run().catch(console.error);
