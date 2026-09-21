const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function printOutput() {
  const m1Query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get();
  let m1Reqs = [];
  m1Query.forEach(doc => { m1Reqs = m1Reqs.concat(doc.data().requirements || []); });
  
  console.log("MA-324-01 ACADEMIC REQUIREMENT COUNT AFTER:", m1Reqs.length);
  m1Reqs.forEach(r => {
     console.log(`\nRequirement ID: ${r.id}`);
     console.log(`Title: ${r.title}`);
     console.log(`Scope: ${r.scopeClassification}`);
     console.log(`Source Version: ${r.sourceVersionId}`);
     (r.subordinateLocators || []).forEach(loc => {
        console.log(`  - Block: ${loc.blockId} [${loc.startOffset}-${loc.endOffset}] Hash: ${loc.sliceHash}`);
        console.log(`    Excerpt: ${loc.excerpt}`);
     });
  });
  
  const cwQuery = await db.collection('module_requirements_maps').where('moduleId', '==', 'COURSE_WIDE').get();
  let cwReqs = [];
  cwQuery.forEach(doc => { cwReqs = cwReqs.concat(doc.data().requirements || []); });
  
  console.log("\nCOURSE_WIDE_ADMINISTRATIVE_POLICY COUNT:", cwReqs.length);
  cwReqs.forEach(r => {
     console.log(`\nRequirement ID: ${r.id}`);
     console.log(`Title: ${r.title}`);
     console.log(`Scope: ${r.scopeClassification}`);
  });
}
printOutput().catch(console.error);
