const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function repair() {
  const query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get();
  
  let adminReqs = [];
  let sourceIds = [];
  
  for (const doc of query.docs) {
    if (doc.id === 'REQ-MAP-MA-324-01-1787879968596') {
      const data = doc.data();
      sourceIds = data.sourceIds || [];
      const reqs = data.requirements || [];
      
      adminReqs = reqs.map(r => {
         return {
            ...r,
            moduleId: "COURSE_WIDE",
            scopeClassification: "COURSE_WIDE_ADMINISTRATIVE_POLICY"
         };
      });
    }
    // Delete the stale module maps
    await doc.ref.delete();
    console.log("Deleted old map:", doc.id);
  }
  
  if (adminReqs.length > 0) {
    const courseMap = {
      id: "REQ-MAP-COURSE_WIDE",
      projectId: "PRJ-324",
      moduleId: "COURSE_WIDE",
      status: "DRAFT",
      requirements: adminReqs,
      sourceIds: sourceIds
    };
    await db.collection('module_requirements_maps').doc(courseMap.id).set(courseMap);
    console.log("Created COURSE_WIDE map with", adminReqs.length, "admin policies.");
  }
}

repair().catch(console.error);
