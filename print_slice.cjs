const fs = require('fs');

async function run() {
  const { Firestore } = require('@google-cloud/firestore');
  const firebaseConfig = require('./firebase-applet-config.json');
  const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });
  
  const vId = "09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2";
  const snap = await db.collection('canonical_source_snapshots').doc(vId).get();
  const blocks = snap.data().preLlmBlocks;
  
  const b39 = blocks.find(b => b.blockId.includes('-40'));
  console.log("Full block 39 text:");
  console.log(b39.rawText);
}
run().catch(console.error);
