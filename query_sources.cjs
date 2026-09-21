const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const sources = await db.collection('module_study_sources').get();
  for (const doc of sources.docs) {
    const data = doc.data();
    if (data.sourceId === 'SRC-998748-6667' || data.sourceId === 'SRC-273902-2552') {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}
run();
