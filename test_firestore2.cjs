const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');

const db = new Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || "(default)"
});

async function run() {
  const reqs = require('./reqs.json').requirementsMap.requirements;
  const vId = reqs[0].sourceVersionId;
  const snap = await db.collection('canonical_source_snapshots').doc(vId).get();
  console.log("Exists:", snap.exists);
  if (snap.exists) {
    const data = snap.data();
    console.log("Keys:", Object.keys(data));
    if (data.blocks) {
      console.log("Blocks length:", data.blocks.length);
      if (data.blocks.length > 0) {
        console.log("First block:", data.blocks[0]);
      }
    }
  }
}

run().catch(console.error);
