const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  if (!doc.exists) { console.log("Missing source snapshot"); return; }
  const data = doc.data();
  console.log(`SourceVersionId: ${data.sourceVersionId}`);
  console.log(`Block count: ${data.preLlmBlocks.length}`);

  const b39 = data.preLlmBlocks.find(b => b.blockId.endsWith('-39'));
  const b40 = data.preLlmBlocks.find(b => b.blockId.endsWith('-40'));
  console.log(`BLK-...-39 type: ${b39.type} - text: ${b39.rawText.substring(0, 30)}`);
  console.log(`BLK-...-40 type: ${b40.type} - text: ${b40.rawText.substring(0, 30)}`);

  const m1Count = (await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get()).size;
  const m2Count = (await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-02').get()).size;
  const cwDoc = await db.collection('module_requirements_maps').doc('REQ-MAP-COURSE_WIDE').get();
  const stpDoc = await db.collection('module_study_packages').doc('STP-463827').get();

  console.log(`MA-324-01 maps: ${m1Count}`);
  console.log(`MA-324-02 maps: ${m2Count}`);
  console.log(`COURSE_WIDE exists: ${cwDoc.exists}`);
  console.log(`STP-463827 exists: ${stpDoc.exists}`);
}
run();
