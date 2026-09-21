import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';
import { validateAcademicSanity } from './server/studyRequirementScope';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const m1Query = await db.collection('module_requirements_maps').where('moduleId', '==', 'MA-324-01').get();
  const mapData = m1Query.docs[0].data();
  
  const isSane = validateAcademicSanity(mapData.requirements);
  console.log(`CLOSED-PHASE ACADEMIC SANITY GATE: ${isSane ? "PASS" : "FAIL"}`);
}
run();
