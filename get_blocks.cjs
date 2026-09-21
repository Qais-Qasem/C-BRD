const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  const data = doc.data();
  const blocks = data.preLlmBlocks.slice(37, 42);
  blocks.forEach((b, i) => {
    console.log(`Block ${37+i}: ID=${b.blockId}, type=${b.type}`);
    console.log(`Text: ${b.rawText.substring(0, 300)}`);
  });
}
run();
