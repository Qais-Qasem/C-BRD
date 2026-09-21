const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const mapDoc = await db.collection('module_requirements_maps').doc('REQ-MAP-MA-324-01-1788402396017').get();
  console.log("Map exists:", mapDoc.exists);
  if (mapDoc.exists) {
    const data = mapDoc.data();
    console.log("Req count:", data.requirements.length);
    console.log("Req IDs:", data.requirements.map(r => r.id).join(", "));
  }

  const snapDoc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  const snap = snapDoc.data();
  console.log("SourceVersionId:", snap.sourceVersionId);
  console.log("Block count:", snap.preLlmBlocks.length);
}
run();
