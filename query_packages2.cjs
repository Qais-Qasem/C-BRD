const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const doc = await db.collection('module_study_packages').doc('STP-463827').get();
  if (doc.exists) {
    console.log("Package exists:", doc.data().id);
  } else {
    console.log("Package does not exist.");
  }
}
run();
