import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';
import { validateAcademicSanity } from './server/studyRequirementScope';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const mapDoc = await db.collection('module_requirements_maps').doc('REQ-MAP-MA-324-01-1788402396017').get();
  const reqs = mapDoc.data().requirements;
  
  const isSane = validateAcademicSanity(reqs);
  console.log(`CLOSED-PHASE ACADEMIC SANITY GATE: ${isSane ? "PASS" : "FAIL"}`);
}
run();
