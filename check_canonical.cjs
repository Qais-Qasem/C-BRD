const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  if (!doc.exists) {
    console.log("Syllabus snapshot not found.");
    return;
  }
  const data = doc.data();
  console.log(`SourceVersionId: ${data.sourceVersionId}`);
  console.log(`Block Count: ${data.preLlmBlocks.length}`);
  const blocks = data.preLlmBlocks;
  const b39 = blocks.find(b => b.blockId.endsWith('-39'));
  const b40 = blocks.find(b => b.blockId.endsWith('-40'));
  console.log(`BLK-...-39 type: ${b39.type}`);
  console.log(`BLK-...-39 text: ${b39.rawText.substring(0, 100)}`);
  console.log(`BLK-...-40 type: ${b40.type}`);
  console.log(`BLK-...-40 text: ${b40.rawText.substring(0, 100)}`);
}
run();
