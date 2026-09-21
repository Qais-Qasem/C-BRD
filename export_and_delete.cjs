const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

const docsToDelete = [
  { collection: 'module_requirements_maps', id: 'REQ-MAP-COURSE_WIDE' },
  { collection: 'module_requirements_maps', id: 'REQ-MAP-MA-324-01-1788400396945' },
  { collection: 'module_requirements_maps', id: 'REQ-MAP-MA-324-02-1788400238113' },
  { collection: 'module_requirements_maps', id: 'REQ-MAP-MA-324-02-1788400423376' },
  { collection: 'module_study_packages', id: 'STP-463827' }
];

async function run() {
  for (const item of docsToDelete) {
    const docRef = db.collection(item.collection).doc(item.id);
    const doc = await docRef.get();
    if (doc.exists) {
      fs.writeFileSync(`recovery_1a_r_b1/${item.id}.json`, JSON.stringify(doc.data(), null, 2));
      console.log(`Exported ${item.id}`);
      await docRef.delete();
      console.log(`Deleted ${item.id}`);
    } else {
      console.log(`Not found: ${item.id}`);
    }
  }
}
run();
