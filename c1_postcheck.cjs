const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const m1Query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get();
  console.log("MA-324-01 map count:", m1Query.size);
  
  const m2Query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-02').get();
  console.log("MA-324-02 map count:", m2Query.size);

  const courseQuery = await db.collection('module_requirements_maps').doc('REQ-MAP-COURSE_WIDE').get();
  console.log("COURSE_WIDE map exists:", courseQuery.exists);
  
  const stpQuery = await db.collection('module_study_packages').get();
  console.log("Packages count:", stpQuery.size);
}
run();
