const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const assets = await db.collection('asset_library').get();
  for (const doc of assets.docs) {
    const data = doc.data();
    if (data.originalFilename && (data.originalFilename.includes("FSVP-PARTICIPANT") || data.originalFilename.includes("FSVP-EXERCISE"))) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
run();
