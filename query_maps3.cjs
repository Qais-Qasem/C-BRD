const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });
async function run() {
  const query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get();
  console.log("MA-324-01 map count:", query.size);
}
run();
