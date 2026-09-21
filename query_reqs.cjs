const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const mapDoc = await db.collection('module_requirements_maps').doc('REQ-MAP-MA-324-01-1788402396017').get();
  if (mapDoc.exists) {
    const data = mapDoc.data();
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("Map not found");
  }
}
run();
