async function run() {
  const { Firestore } = require('@google-cloud/firestore');
  const firebaseConfig = require('./firebase-applet-config.json');
  const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

  // Get data
  const reqDocs = await db.collection('module_requirements_maps').get();
  const allReqMaps = [];
  reqDocs.forEach(d => allReqMaps.push(d.data()));

  const sourceDocs = await db.collection('module_sources').get();
  const allSources = [];
  sourceDocs.forEach(d => allSources.push(d.data()));

  const snapDocs = await db.collection('canonical_source_snapshots').get();
  const snapshots = [];
  snapDocs.forEach(d => snapshots.push(d.data()));

  // Dynamically import the ts module using ts-node or just compiling it?
  // I will just use tsx.
}
run();
