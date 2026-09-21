const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const query = await db.collection('module_requirements_maps').get();
  query.forEach(doc => {
    const data = doc.data();
    console.log(`\nDoc ID: ${doc.id}`);
    console.log(`Module ID: ${data.moduleId}`);
    console.log(`Req Count: ${data.requirements?.length || 0}`);
    const reqs = data.requirements || [];
    reqs.forEach(r => {
      console.log(`  - ${r.id}: ${r.title} [${r.scopeClassification}]`);
    });
  });
}
run();
