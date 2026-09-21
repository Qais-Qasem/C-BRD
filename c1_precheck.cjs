const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  console.log("SourceVersionId:", doc.data().sourceVersionId);
  console.log("Block count:", doc.data().preLlmBlocks.length);
  
  const m1Query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get();
  console.log("MA-324-01 map count:", m1Query.size);
}
run();
