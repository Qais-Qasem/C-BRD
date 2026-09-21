import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const reqMapsSnapshot = await db.collection('module_requirements_maps').get();
  console.log("module_requirements_maps IDs:");
  reqMapsSnapshot.forEach(d => console.log(d.id));

  const pkgSnapshot = await db.collection('module_study_packages').get();
  console.log("\nmodule_study_packages IDs:");
  pkgSnapshot.forEach(d => console.log(d.id));
}
run();
