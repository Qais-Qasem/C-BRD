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
  
  if (snap.exists) {
    const blocks = snap.data().preLlmBlocks || [];
    blocks.forEach((b, index) => {
      console.log(`[${index}] ${b.rawText}`);
    });
  }
}

run().catch(console.error);
