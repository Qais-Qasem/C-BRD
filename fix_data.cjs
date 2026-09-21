const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get();
  console.log("Found MA-324-01 maps:", query.size);
  let oldMapId = null;
  let adminReqs = [];
  query.forEach(doc => {
     console.log("Map ID:", doc.id);
     oldMapId = doc.id;
     const data = doc.data();
     const reqs = data.requirements || [];
     console.log("Requirements count:", reqs.length);
     reqs.forEach(r => {
        console.log(` - ${r.id}: ${r.title}`);
        adminReqs.push(r);
     });
  });
}
run().catch(console.error);
