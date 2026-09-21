const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });
async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  const blocks = doc.data().preLlmBlocks;
  blocks.forEach((b, i) => {
    if (i > 20 && i < 50) {
      console.log(`[${i}] ${b.type}: ${b.rawText.substring(0, 60).replace(/\n/g, ' ')}`);
    }
  });
}
run();
